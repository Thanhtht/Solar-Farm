import { test, expect } from "@playwright/test";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { createSession, presetConfig } from "../src/lib/scenario-simulation";

test("Monitoring conserves power and energy, has three distinct issues and aligned histories", () => {
  const run = createMonitoringSnapshot();
  const byId = (id: string) => run.assets.find((asset) => asset.id === id)!;
  const issues = run.assets.filter((asset) => asset.attention);
  expect(issues.map((asset) => [asset.id, asset.attention!.level])).toEqual([
    ["INV-03", "critical"],
    ["PV-06", "warning"],
    ["GW-01", "warning"],
  ]);
  expect(run.powerMW).toBeCloseTo(30.24);
  expect(run.availability).toBe(87.5);
  expect(byId("TR-01").signals[0].value).toBeCloseTo(run.powerMW!);
  expect(run.lossMWh).toBeCloseTo(1.08);
  expect(byId("INV-03").monitoringIssue!.impact).toEqual({
    referenceMW: 4.32,
    actualMW: 0,
    durationMinutes: 15,
    lossMWh: run.lossMWh,
  });
  expect(run.energyMWh).toBeCloseTo(
    run.powerHistory
      .slice(0, -1)
      .reduce<number>((sum, power) => sum + power! / 60, 0),
  );
  expect(run.lossMWh).toBeCloseTo(
    byId("INV-03")
      .signals[0].history.slice(0, -1)
      .reduce<number>(
        (sum, power, i) =>
          sum + (byId("INV-01").signals[0].history[i]! - power!) / 60,
        0,
      ),
  );
  expect(byId("INV-03").connection).toBe("Đang kết nối");
  expect(
    byId("INV-03")
      .signals[0].history.slice(0, 15)
      .every((value) => value! > 0),
  ).toBe(true);
  expect(
    byId("INV-03")
      .signals[0].history.slice(15)
      .every((value) => value === 0),
  ).toBe(true);
  expect(
    byId("PV-06").signals.find((signal) => signal.id.endsWith(".pdc"))!.value,
  ).toBe(4.5);
  expect(byId("INV-06").signals[0].value).toBe(4.32);
  for (const asset of run.assets)
    for (const signal of asset.signals) {
      expect(signal.history).toHaveLength(31);
      expect(signal.historyTimes).toEqual(run.times);
      expect(signal.history.at(-1)).toBe(signal.value);
      expect(signal.quality).toBe("valid");
      expect(signal.snapshotId).toBe(run.id);
    }
  expect(run.times[0]).toBe("2026-11-02T03:00:00.000Z");
  expect(run.times.at(-1)).toBe(run.sampledAt);
  const saved = JSON.stringify(run);
  createSession(presetConfig("fault"));
  expect(JSON.stringify(run)).toBe(saved);
  expect(createMonitoringSnapshot()).toEqual(run);
});

test("Current issue selection explains impact or risk, and selected device details render history", async ({
  page,
}) => {
  await page.goto("/");
  const notices = page.getByLabel("Thiết bị cần chú ý");
  await expect(notices.locator("button.critical")).toHaveCount(1);
  await expect(notices.locator("button.warning")).toHaveCount(2);
  const hud = page.getByRole("region", { name: "Hồ sơ nhanh thiết bị" });
  const summary = hud.getByLabel("Giải thích vấn đề thiết bị");
  for (const [id, text, level] of [
    ["INV-03", "1,08 MWh", "critical"],
    ["PV-06", "hiệu suất pin có thể giảm", "warning"],
    ["GW-01", "cảnh báo bị chậm", "warning"],
  ]) {
    await notices.getByRole("button", { name: new RegExp(id) }).click();
    await page.locator(".scene-panel").scrollIntoViewIfNeeded();
    await expect(hud).toHaveClass(new RegExp(level));
    await expect(summary).toContainText(text);
    if (level === "warning")
      await expect(summary).toContainText(/chưa.*(tổn thất|giảm sản lượng)/);
    await hud
      .getByRole("button", { name: "Xem chi tiết", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Giải thích vấn đề thiết bị")).toContainText(
      text,
    );
    await expect(dialog).toContainText("Lịch sử giả định · 10:00–10:30 ICT");
    const charts = dialog.locator("svg.trend");
    const count = await charts.count();
    expect(count).toBeGreaterThan(1);
    for (let index = 0; index < count; index++) {
      await expect(charts.nth(index)).toHaveAttribute(
        "aria-label",
        /10:00 đến 10:30/,
      );
      await expect(charts.nth(index).locator("circle")).toHaveCount(31);
      await expect(charts.nth(index).locator("polyline")).toHaveAttribute(
        "points",
        /\S+ \S+ /,
      );
    }
    if (id === "PV-06") {
      await dialog
        .locator(".device-trend-card")
        .first()
        .scrollIntoViewIfNeeded();
      await expect(charts.first()).toBeVisible();
      await dialog.screenshot({ path: "test-results/current-pv-history.png" });
    }
    await dialog.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await hud.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByLabel("Giải thích vấn đề thiết bị"),
  ).toContainText("850 ms");
  await page
    .getByRole("dialog")
    .locator(".device-trend-card")
    .last()
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("dialog").locator("svg.trend").last(),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/current-mobile.png" });
});
