import { getHongLiemBlock } from "../data/hong-liem-blocks";
import { hongLiemFields } from "../data/hong-liem-layout";
import { type PlantId } from "../data/plant-profiles";
import { type Signal } from "../data/plant";
import { baseline } from "./simulation";
import {
  getHistoryBranches,
  getHistoryModel,
  historyEvents,
  historyModel,
  type HistoryBranch,
  type HistoryEvent,
} from "../data/history-model";
import {
  calendarDate,
  dateNumber,
  datesInRange,
  historyWindow,
  validateHistoryRange,
  type DateRange,
  type HistoryWindow,
} from "./history-dates";

export type EnergyTotals = {
  /** Sum of valid observed intervals; null when no daylight observation exists. */
  actualEnergyMWh: number | null;
  /** Full-day healthy model, including intervals without observations. */
  expectedEnergyMWh: number;
  /** Healthy reference on exactly the valid observed intervals. */
  matchedExpectedEnergyMWh: number | null;
  validIntervals: number;
  expectedIntervals: number;
};
export type EnergySummary = EnergyTotals & {
  performancePct: number | null;
  shortfallMWh: number | null;
  coveragePct: number | null;
  quality: "complete" | "partial" | "missing";
};
export type HistoryInterval = {
  /** Start of the 15-minute integration interval, local plant calendar minute. */
  minute: number;
  irradianceWm2: number;
  moduleTemperatureC: number;
  expectedPowerMW: number;
  actualPowerMW: number | null;
  quality: Signal["quality"];
};
export type HistoryDay = HistoryBranch &
  EnergySummary & {
    date: string;
    source: "simulated";
    modelVersion: string;
    weather: "clear" | "variable" | "overcast";
    events: HistoryEvent[];
    intervals: HistoryInterval[];
  };
export type PerformanceHistory = {
  plantId?: PlantId;
  window: HistoryWindow;
  seed: number;
  source: "simulated";
  modelVersion: string;
  days: HistoryDay[];
};

/** Stable numeric noise keyed by calendar date and asset, never window position. */
function noise(key: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x100000000;
}

/** Weighted energy ratio; missing observations never become zero production. */
export function summarizeEnergy(rows: readonly EnergyTotals[]): EnergySummary {
  const sum = (key: keyof EnergyTotals) =>
    rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  const validIntervals = sum("validIntervals");
  const expectedIntervals = sum("expectedIntervals");
  const actualEnergyMWh = validIntervals ? sum("actualEnergyMWh") : null;
  const matchedExpectedEnergyMWh = validIntervals
    ? sum("matchedExpectedEnergyMWh")
    : null;
  return {
    actualEnergyMWh,
    expectedEnergyMWh: sum("expectedEnergyMWh"),
    matchedExpectedEnergyMWh,
    validIntervals,
    expectedIntervals,
    performancePct:
      matchedExpectedEnergyMWh !== null && matchedExpectedEnergyMWh > 0
        ? (actualEnergyMWh! / matchedExpectedEnergyMWh) * 100
        : null,
    shortfallMWh:
      actualEnergyMWh === null
        ? null
        : matchedExpectedEnergyMWh! - actualEnergyMWh,
    coveragePct: expectedIntervals
      ? (validIntervals / expectedIntervals) * 100
      : null,
    quality: !validIntervals
      ? "missing"
      : validIntervals === expectedIntervals
        ? "complete"
        : "partial",
  };
}

function summarizeIntervals(intervals: HistoryInterval[]): EnergySummary {
  const daylight = intervals.filter((interval) => interval.expectedPowerMW > 0);
  const valid = daylight.filter(
    (interval) =>
      interval.quality === "valid" && interval.actualPowerMW !== null,
  );
  const hours = historyModel.intervalMinutes / 60;
  return summarizeEnergy([
    {
      actualEnergyMWh: valid.length
        ? valid.reduce((n, s) => n + s.actualPowerMW! * hours, 0)
        : null,
      expectedEnergyMWh: daylight.reduce(
        (n, s) => n + s.expectedPowerMW * hours,
        0,
      ),
      matchedExpectedEnergyMWh: valid.length
        ? valid.reduce((n, s) => n + s.expectedPowerMW * hours, 0)
        : null,
      validIntervals: valid.length,
      expectedIntervals: daylight.length,
    },
  ]);
}

/** Low-level deterministic day model; UI must query through historyRange. */
export function generateHistoryDay(
  date: string,
  assetId: string,
  seed: number = historyModel.seed,
  plantId: PlantId = "sava",
): HistoryDay {
  const historyBranches = getHistoryBranches(plantId);
  calendarDate(date);
  if (!Number.isSafeInteger(seed)) throw new RangeError("Seed không hợp lệ.");
  const branch = historyBranches.find((item) => item.assetId === assetId);
  if (!branch)
    throw new RangeError("Cụm pin không tồn tại trong cấu hình lịch sử.");
  const phase =
    (((dateNumber(date) - dateNumber(historyModel.cycleEpoch)) %
      historyModel.cycleDays) +
      historyModel.cycleDays) %
    historyModel.cycleDays;
  const weather =
    phase % 7 === 2
      ? "overcast"
      : [1, 4, 5].includes(phase % 7)
        ? "variable"
        : "clear";
  const events = historyEvents(phase, assetId);
  const dayNoise = noise(`${date}:weather`, seed);
  const areaNoise = noise(`${date}:${branch.area}:clouds`, seed);
  const operatingFactor =
    0.985 + 0.015 * noise(`${date}:${assetId}:operation`, seed);
  const intervals: HistoryInterval[] = [];
  for (let minute = 0; minute < 1440; minute += historyModel.intervalMinutes) {
    // Midpoint quadrature: nighttime is zero; solar shape rises and falls daily.
    const hour = (minute + historyModel.intervalMinutes / 2) / 60;
    const solar = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12));
    const daylight =
      minute >= historyModel.sunriseMinute &&
      minute < historyModel.sunsetMinute;
    const cloud =
      weather === "overcast"
        ? 0.25 + 0.1 * dayNoise
        : weather === "variable"
          ? 0.55 + 0.25 * Math.sin(hour * 1.8 + areaNoise * 4) ** 2
          : 0.94 + 0.06 * dayNoise;
    const localCloud =
      branch.area === "Khu B" && phase % 7 === 4 && hour >= 11 && hour < 14
        ? 0.55
        : 1;
    const irradianceWm2 = daylight
      ? solar * (900 + 100 * dayNoise) * cloud * localCloud
      : 0;
    const ambientC = 26 + 6 * solar + 2 * dayNoise;
    const moduleTemperatureC = ambientC + irradianceWm2 * 0.03;
    const temperatureFactor = Math.max(
      0.8,
      1 + historyModel.temperatureCoefficient * (moduleTemperatureC - 25),
    );
    const expectedPowerMW = Math.min(
      branch.acLimitMW,
      ((branch.nominalDCMWp * irradianceWm2) / baseline.referenceIrradiance) *
        baseline.dcDerating *
        baseline.efficiency *
        temperatureFactor,
    );
    const active = events.filter(
      (event) => minute >= event.startMinute && minute < event.endMinute,
    );
    const stopped = active.some((event) => event.kind === "inverter-stop");
    const dustFactor = active.some((event) => event.kind === "soiling")
      ? 1 - (0.02 + (phase - 3) * 0.018)
      : 1;
    const branchFactor = active.reduce(
      (factor, event) => factor * (event.factor ?? 1),
      1,
    );
    const quality: Signal["quality"] = active.some(
      (event) => event.kind === "data-gap",
    )
      ? "missing"
      : active.some((event) => event.kind === "stale-data")
        ? "stale"
        : active.some((event) => event.kind === "invalid-data")
          ? "invalid"
          : "valid";
    intervals.push({
      minute,
      irradianceWm2,
      moduleTemperatureC,
      expectedPowerMW,
      actualPowerMW:
        quality !== "valid"
          ? null
          : stopped
            ? 0
            : expectedPowerMW * operatingFactor * dustFactor * branchFactor,
      quality,
    });
  }
  return {
    ...branch,
    date,
    source: "simulated",
    modelVersion: historyModel.version,
    weather,
    events,
    intervals,
    ...summarizeIntervals(intervals),
  };
}

/** Capture now once to keep presets and records on the same plant calendar day. */
export function createPerformanceHistory(
  options: { now?: Date; seed?: number; plantId?: PlantId } = {},
): PerformanceHistory {
  const window = historyWindow(options.now ?? new Date());
  const plantId = options.plantId ?? "sava";
  const historyBranches = getHistoryBranches(plantId);
  const seed = options.seed ?? getHistoryModel(plantId).seed;
  return {
    window,
    plantId,
    seed,
    source: "simulated",
    modelVersion: historyModel.version,
    days: datesInRange(window).flatMap((date) =>
      historyBranches.map((branch) =>
        generateHistoryDay(date, branch.assetId, seed, plantId),
      ),
    ),
  };
}

export type HistoryRangeResult = {
  range: DateRange;
  summary: EnergySummary;
  byDay: ({ date: string } & EnergySummary)[];
  byAsset: (HistoryBranch & EnergySummary)[];
  dataScope?: string;
  parentId?: string;
};
export function historyRange(
  data: PerformanceHistory,
  range: DateRange,
  assetId?: string,
): HistoryRangeResult {
  const block =
    data.plantId === "hong-liem-3" ? getHongLiemBlock(assetId) : undefined;
  if (block) {
    const parent = historyRange(data, range, block.parentId),
      count = hongLiemFields[block.fieldIndex].rows.length;
    const scale = <T extends EnergySummary>(row: T): T => ({
      ...row,
      actualEnergyMWh:
        row.actualEnergyMWh === null ? null : row.actualEnergyMWh / count,
      expectedEnergyMWh: row.expectedEnergyMWh / count,
      matchedExpectedEnergyMWh:
        row.matchedExpectedEnergyMWh === null
          ? null
          : row.matchedExpectedEnergyMWh / count,
      shortfallMWh: row.shortfallMWh === null ? null : row.shortfallMWh / count,
    });
    return {
      ...parent,
      parentId: block.parentId,
      dataScope: `Ước tính phân bổ từ vùng ${block.parentId}; không có số đo riêng cụm nhỏ`,
      summary: scale(parent.summary),
      byDay: parent.byDay.map(scale),
      byAsset: parent.byAsset.map((row) => ({
        ...scale(row),
        assetId: block.id,
        nominalDCMWp: row.nominalDCMWp / count,
        acLimitMW: row.acLimitMW / count,
      })),
    };
  }
  const historyBranches = getHistoryBranches(data.plantId);
  validateHistoryRange(range, data.window);
  if (assetId && !historyBranches.some((branch) => branch.assetId === assetId))
    throw new RangeError("Cụm pin không tồn tại trong cấu hình lịch sử.");
  const branches = historyBranches.filter(
    (branch) => !assetId || branch.assetId === assetId,
  );
  const dates = datesInRange(range);
  const selected = data.days.filter(
    (day) =>
      day.date >= range.start &&
      day.date <= range.end &&
      (!assetId || day.assetId === assetId),
  );
  // A missing row is a broken dataset, never an apparently healthy smaller plant.
  const keys = new Set(selected.map((day) => `${day.date}:${day.assetId}`));
  if (
    selected.length !== dates.length * branches.length ||
    keys.size !== selected.length ||
    dates.some((date) =>
      branches.some((branch) => !keys.has(`${date}:${branch.assetId}`)),
    )
  )
    throw new RangeError(
      "Bộ dữ liệu lịch sử thiếu hoặc trùng bản ghi ngày/cụm.",
    );
  return {
    range: { ...range },
    summary: summarizeEnergy(selected),
    byDay: dates.map((date) => ({
      date,
      ...summarizeEnergy(selected.filter((day) => day.date === date)),
    })),
    byAsset: branches.map((branch) => ({
      ...branch,
      ...summarizeEnergy(
        selected.filter((day) => day.assetId === branch.assetId),
      ),
    })),
  };
}
