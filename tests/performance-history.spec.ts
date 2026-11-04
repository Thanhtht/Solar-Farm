import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assets } from "../src/data/plant";
import { historyBranches } from "../src/data/history-model";
import {
  datesInRange,
  historyWindow,
  historyPreset,
  previousPeriod,
  validateHistoryRange,
} from "../src/lib/history-dates";
import {
  createPerformanceHistory,
  generateHistoryDay,
  historyRange,
  summarizeEnergy,
} from "../src/lib/performance-history";
import { createMonitoringSnapshot } from "../src/lib/monitoring";

const now = new Date("2026-11-04T05:00:00Z");
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("Plant calendar presets end yesterday and the month window clamps correctly", () => {
  const window = historyWindow(now);
  expect(window).toMatchObject({
    today: "2026-11-04",
    start: "2026-10-04",
    end: "2026-11-03",
  });
  expect(datesInRange(window)).toHaveLength(31);
  expect(historyPreset("1d", window)).toEqual({
    start: "2026-11-03",
    end: "2026-11-03",
  });
  expect(historyPreset("3d", window)).toEqual({
    start: "2026-11-01",
    end: "2026-11-03",
  });
  expect(historyPreset("7d", window)).toEqual({
    start: "2026-10-28",
    end: "2026-11-03",
  });
  expect(historyPreset("all", window)).toEqual({
    start: "2026-10-04",
    end: "2026-11-03",
  });
  expect(historyWindow(new Date("2026-03-31T05:00:00Z"))).toMatchObject({
    start: "2026-02-28",
    end: "2026-03-30",
  });
  expect(historyWindow(new Date("2024-03-31T05:00:00Z"))).toMatchObject({
    start: "2024-02-29",
    end: "2024-03-30",
  });
  expect(historyWindow(new Date("2027-01-01T05:00:00Z"))).toMatchObject({
    start: "2026-12-01",
    end: "2026-12-31",
  });
});

test("UTC+7 rollover changes the window only at plant midnight", () => {
  expect(historyWindow(new Date("2026-11-03T16:59:59Z"))).toMatchObject({
    today: "2026-11-03",
    end: "2026-11-02",
  });
  expect(historyWindow(new Date("2026-11-03T17:00:00Z"))).toMatchObject({
    today: "2026-11-04",
    end: "2026-11-03",
  });
});

test("Custom dates cannot select today, future, invalid, reversed or out-of-window days", () => {
  const window = historyWindow(now);
  for (const range of [
    { start: "2026-11-04", end: "2026-11-04" },
    { start: "2026-11-03", end: "2026-11-05" },
    { start: "2026-10-03", end: "2026-10-05" },
    { start: "2026-11-03", end: "2026-11-01" },
    { start: "2026-10-32", end: "2026-11-03" },
    { start: "2026-02-30", end: "2026-11-03" },
    { start: "03/11/2026", end: "2026-11-03" },
  ])
    expect(() => validateHistoryRange(range, window)).toThrow(RangeError);
  expect(
    validateHistoryRange({ start: window.start, end: window.start }, window),
  ).toEqual({ start: window.start, end: window.start });
  expect(() => historyWindow(new Date(NaN))).toThrow(RangeError);
  expect(() => generateHistoryDay("2026-10-04", "PV-01", NaN)).toThrow(
    RangeError,
  );
});

test("Records are deterministic across reloads and rolling windows without mutating current state", () => {
  const before = JSON.stringify(assets);
  const snapshot = createMonitoringSnapshot();
  const saved = JSON.stringify(snapshot);
  const data = createPerformanceHistory({ now });
  expect(data.days).toHaveLength(31 * 8);
  expect(
    new Set(data.days.map((day) => `${day.date}:${day.assetId}`)).size,
  ).toBe(248);
  expect(digest(data)).toBe(digest(createPerformanceHistory({ now })));
  const tomorrow = createPerformanceHistory({
    now: new Date("2026-11-05T05:00:00Z"),
  });
  expect(digest(data.days.filter((day) => day.date === "2026-10-20"))).toBe(
    digest(tomorrow.days.filter((day) => day.date === "2026-10-20")),
  );
  expect(
    generateHistoryDay("2026-10-04", "PV-01", 123).actualEnergyMWh,
  ).not.toBe(generateHistoryDay("2026-10-04", "PV-01", 124).actualEnergyMWh);
  data.days[0].intervals[0].actualPowerMW = 123;
  expect(JSON.stringify(assets)).toBe(before);
  expect(JSON.stringify(snapshot)).toBe(saved);
  expect(
    generateHistoryDay("2026-10-04", "PV-01").intervals[0].actualPowerMW,
  ).toBe(0);
});

test("All intervals reconcile to daily energy, respect AC limits and stop at night", () => {
  const data = createPerformanceHistory({ now });
  for (const day of data.days) {
    expect(day.intervals).toHaveLength(96);
    expect(day.expectedIntervals).toBe(48);
    let actual = 0,
      expected = 0,
      matched = 0;
    for (const slot of day.intervals) {
      assert(slot.expectedPowerMW >= 0 && slot.expectedPowerMW <= 5);
      if (slot.minute < 360 || slot.minute >= 1080)
        assert.equal(slot.expectedPowerMW, 0);
      if (slot.actualPowerMW !== null) {
        assert.equal(slot.quality, "valid");
        assert(
          slot.actualPowerMW >= 0 && slot.actualPowerMW <= slot.expectedPowerMW,
        );
        actual += slot.actualPowerMW / 4;
        matched += slot.expectedPowerMW / 4;
      } else assert.notEqual(slot.quality, "valid");
      expected += slot.expectedPowerMW / 4;
    }
    expect(day.expectedEnergyMWh).toBeCloseTo(expected, 10);
    if (day.actualEnergyMWh !== null) {
      expect(day.actualEnergyMWh).toBeCloseTo(actual, 10);
      expect(day.matchedExpectedEnergyMWh).toBeCloseTo(matched, 10);
    }
  }
});

test("Clouds lower yield without inventing equipment inefficiency; localized clouds affect one area", () => {
  const clear = generateHistoryDay("2026-10-04", "PV-01");
  const cloudy = generateHistoryDay("2026-10-06", "PV-01");
  expect(clear.weather).toBe("clear");
  expect(cloudy.weather).toBe("overcast");
  expect(cloudy.actualEnergyMWh!).toBeLessThan(clear.actualEnergyMWh! * 0.5);
  expect(cloudy.performancePct!).toBeGreaterThanOrEqual(98.5);
  expect(clear.performancePct!).toBeGreaterThanOrEqual(98.5);
  const areaA = generateHistoryDay("2026-10-08", "PV-01");
  const areaB = generateHistoryDay("2026-10-08", "PV-07");
  expect(areaB.expectedEnergyMWh).toBeLessThan(areaA.expectedEnergyMWh);
  expect(areaB.performancePct!).toBeGreaterThanOrEqual(98.5);
});

test("Soiling progresses then cleaning restores performance while the healthy reference stays independent", () => {
  const first = generateHistoryDay("2026-10-07", "PV-05");
  const dirty = generateHistoryDay("2026-10-16", "PV-05");
  const cleaned = generateHistoryDay("2026-10-17", "PV-05");
  expect(first.events.map((e) => e.kind)).toContain("soiling");
  expect(dirty.performancePct!).toBeLessThan(first.performancePct! - 14);
  expect(cleaned.events.map((e) => e.kind)).toContain("cleaning");
  expect(cleaned.performancePct!).toBeGreaterThanOrEqual(98.5);
  const healthy = generateHistoryDay("2026-10-16", "PV-07");
  expect(dirty.expectedEnergyMWh).toBeCloseTo(healthy.expectedEnergyMWh, 10);
});

test("A continuous inverter outage yields partial-day loss, valid zero day and recovery", () => {
  const stopped = generateHistoryDay("2026-10-20", "PV-03");
  const zero = generateHistoryDay("2026-10-21", "PV-03");
  const recovery = generateHistoryDay("2026-10-22", "PV-03");
  expect(
    stopped.intervals.find((s) => s.minute === 585)!.actualPowerMW!,
  ).toBeGreaterThan(0);
  expect(stopped.intervals.find((s) => s.minute === 600)!.actualPowerMW).toBe(
    0,
  );
  expect(zero.actualEnergyMWh).toBe(0);
  expect(zero.performancePct).toBe(0);
  expect(zero.coveragePct).toBe(100);
  expect(zero.quality).toBe("complete");
  expect(recovery.intervals.find((s) => s.minute === 525)!.actualPowerMW).toBe(
    0,
  );
  expect(
    recovery.intervals.find((s) => s.minute === 540)!.actualPowerMW!,
  ).toBeGreaterThan(0);
  expect(recovery.performancePct!).toBeGreaterThan(stopped.performancePct!);
});

test("Missing, stale and invalid intervals use matched reference, never fabricated zero production", () => {
  const gap = generateHistoryDay("2026-10-25", "PV-08");
  expect(gap.validIntervals).toBe(36);
  expect(gap.coveragePct).toBe(75);
  expect(gap.quality).toBe("partial");
  expect(gap.performancePct!).toBeGreaterThanOrEqual(98.5);
  expect(gap.matchedExpectedEnergyMWh!).toBeLessThan(gap.expectedEnergyMWh);
  const missing = generateHistoryDay("2026-10-26", "PV-08");
  expect(missing.actualEnergyMWh).toBeNull();
  expect(missing.performancePct).toBeNull();
  expect(missing.shortfallMWh).toBeNull();
  expect(missing.quality).toBe("missing");
  expect(missing.expectedEnergyMWh).toBeGreaterThan(0);
  expect(
    generateHistoryDay("2026-10-28", "PV-02").intervals.find(
      (s) => s.minute === 660,
    ),
  ).toMatchObject({ actualPowerMW: null, quality: "stale" });
  expect(
    generateHistoryDay("2026-10-29", "PV-02").intervals.find(
      (s) => s.minute === 780,
    ),
  ).toMatchObject({ actualPowerMW: null, quality: "invalid" });
});

test("Aggregation uses energy weights, supports above-expectation values and undefined ratios", () => {
  const summary = summarizeEnergy([
    {
      actualEnergyMWh: 1,
      expectedEnergyMWh: 2,
      matchedExpectedEnergyMWh: 2,
      validIntervals: 1,
      expectedIntervals: 1,
    },
    {
      actualEnergyMWh: 9,
      expectedEnergyMWh: 9,
      matchedExpectedEnergyMWh: 9,
      validIntervals: 1,
      expectedIntervals: 1,
    },
  ]);
  expect(summary.performancePct).toBeCloseTo(1000 / 11);
  expect(summary.performancePct).not.toBe(75);
  expect(summary.shortfallMWh).toBe(1);
  const zeroExpected = {
    actualEnergyMWh: 0,
    expectedEnergyMWh: 0,
    matchedExpectedEnergyMWh: 0,
    validIntervals: 1,
    expectedIntervals: 1,
  };
  expect(summarizeEnergy([zeroExpected]).performancePct).toBeNull();
  expect(
    summarizeEnergy([
      {
        ...zeroExpected,
        actualEnergyMWh: 2,
        expectedEnergyMWh: 1,
        matchedExpectedEnergyMWh: 1,
      },
    ]).performancePct,
  ).toBe(200);
  expect(summarizeEnergy([])).toMatchObject({
    actualEnergyMWh: null,
    performancePct: null,
    coveragePct: null,
    quality: "missing",
  });
});

test("Daily and asset breakdowns reconcile without counting transformers or DC twice", () => {
  const data = createPerformanceHistory({ now });
  const range = historyRange(data, historyPreset("7d", data.window));
  expect(range.byDay).toHaveLength(7);
  expect(range.byAsset).toHaveLength(8);
  const byDay = summarizeEnergy(range.byDay);
  for (const key of [
    "actualEnergyMWh",
    "expectedEnergyMWh",
    "matchedExpectedEnergyMWh",
    "performancePct",
    "shortfallMWh",
    "coveragePct",
  ] as const)
    expect(byDay[key]).toBeCloseTo(range.summary[key]!, 9);
  expect(byDay.quality).toBe(range.summary.quality);
  expect(byDay.validIntervals).toBe(range.summary.validIntervals);
  expect(byDay.expectedIntervals).toBe(range.summary.expectedIntervals);
  const byAsset = summarizeEnergy(range.byAsset);
  expect(byAsset.actualEnergyMWh).toBeCloseTo(
    range.summary.actualEnergyMWh!,
    10,
  );
  expect(byAsset.expectedEnergyMWh).toBeCloseTo(
    range.summary.expectedEnergyMWh,
    10,
  );
  for (const branch of historyBranches) {
    const selected = historyRange(data, range.range, branch.assetId);
    expect(selected.byAsset).toHaveLength(1);
    expect(selected.summary).toEqual(
      summarizeEnergy(
        data.days.filter(
          (day) =>
            day.assetId === branch.assetId &&
            day.date >= range.range.start &&
            day.date <= range.range.end,
        ),
      ),
    );
  }
  expect(() => historyRange(data, range.range, "TR-01")).toThrow(RangeError);
  const missingRow = {
    ...data,
    days: data.days.filter(
      (day) => !(day.date === "2026-11-03" && day.assetId === "PV-01"),
    ),
  };
  expect(() => historyRange(missingRow, range.range)).toThrow(
    /thiếu hoặc trùng/,
  );
  const duplicate = { ...data, days: [...data.days, data.days.at(-1)!] };
  expect(() => historyRange(duplicate, range.range)).toThrow(
    /thiếu hoặc trùng/,
  );
});

test("A previous comparison period keeps its full length and fails when outside available history", () => {
  const data = createPerformanceHistory({ now });
  const previous = previousPeriod(historyPreset("7d", data.window));
  expect(previous).toEqual({ start: "2026-10-21", end: "2026-10-27" });
  expect(historyRange(data, previous).byDay).toHaveLength(7);
  expect(() =>
    historyRange(data, previousPeriod(historyPreset("all", data.window))),
  ).toThrow(RangeError);
});
