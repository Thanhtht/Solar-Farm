import {
  datesInRange,
  previousPeriod,
  validateHistoryRange,
  type DateRange,
} from "./history-dates";
import {
  historyRange,
  summarizeEnergy,
  type EnergySummary,
  type PerformanceHistory,
} from "./performance-history";

export type HeatmapMetric = "energy" | "performance";
export type HeatmapReading = {
  color: string;
  label: string;
  quality: EnergySummary["quality"];
  coveragePct: number | null;
};
export const HISTORY_MISSING_COLOR = "#94a3b8";
export const HISTORY_DAILY_ENERGY_MAX = 45;
export const performanceStops = [
  { value: 0, color: "#b94132" },
  { value: 70, color: "#e89a49" },
  { value: 85, color: "#e7c956" },
  { value: 95, color: "#4ab7b0" },
  { value: 100, color: "#2464b4" },
];
export function heatmapColor(
  value: number | null,
  metric: HeatmapMetric,
  days: number,
) {
  if (value === null || !Number.isFinite(value)) return HISTORY_MISSING_COLOR;
  const stops =
    metric === "performance"
      ? performanceStops
      : [
          { value: 0, color: "#dceafa" },
          { value: HISTORY_DAILY_ENERGY_MAX * days, color: "#1759a8" },
        ];
  const bounded = Math.max(
    stops[0].value,
    Math.min(stops.at(-1)!.value, value),
  );
  const right = stops.findIndex((stop) => stop.value >= bounded);
  if (right <= 0) return stops[0].color;
  const a = stops[right - 1],
    b = stops[right];
  const t = (bounded - a.value) / (b.value - a.value);
  const rgb = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (
    "#" +
    rgb(a.color)
      .map((v, i) =>
        Math.round(v + (rgb(b.color)[i] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function historyScopeRange(
  data: PerformanceHistory,
  range: DateRange,
  scope = "plant",
) {
  if (scope === "plant") return historyRange(data, range);
  if (!scope.startsWith("area:")) return historyRange(data, range, scope);
  const all = historyRange(data, range);
  const byAsset = all.byAsset.filter((row) => row.area === scope.slice(5));
  if (!byAsset.length) throw new RangeError("Khu vực không tồn tại.");
  const ids = new Set(byAsset.map((row) => row.assetId));
  return {
    ...all,
    byAsset,
    summary: summarizeEnergy(byAsset),
    byDay: all.byDay.map((day) => ({
      date: day.date,
      ...summarizeEnergy(
        data.days.filter(
          (row) => row.date === day.date && ids.has(row.assetId),
        ),
      ),
    })),
  };
}

export function compareHistory(
  data: PerformanceHistory,
  primaryRange: DateRange,
  comparisonRange = previousPeriod(primaryRange),
  assetId?: string,
  comparisonScope = assetId,
) {
  const primary = historyScopeRange(data, primaryRange, assetId);
  try {
    validateHistoryRange(comparisonRange, data.window);
  } catch {
    return {
      available: false as const,
      primary,
      comparisonRange,
      reason:
        "Không đủ dữ liệu cho kỳ đối chiếu. Hãy chọn khoảng nằm trong tháng dữ liệu hiện có.",
    };
  }
  const comparison = historyScopeRange(data, comparisonRange, comparisonScope);
  const primaryDays = datesInRange(primaryRange).length;
  const comparisonDays = datesInRange(comparisonRange).length;
  const a = primary.summary,
    b = comparison.summary;
  const complete = a.quality === "complete" && b.quality === "complete";
  const mean = (summary: EnergySummary, days: number) =>
    summary.actualEnergyMWh === null ? null : summary.actualEnergyMWh / days;
  return {
    available: true as const,
    primary,
    comparison,
    primaryDays,
    comparisonDays,
    primaryDailyMWh: mean(a, primaryDays),
    comparisonDailyMWh: mean(b, comparisonDays),
    // Compare rates per day if lengths differ, and suppress energy claims on partial data.
    dailyEnergyChangePct:
      complete && b.actualEnergyMWh! > 0
        ? (a.actualEnergyMWh! /
            primaryDays /
            (b.actualEnergyMWh! / comparisonDays) -
            1) *
          100
        : null,
    performanceChangePoints:
      a.performancePct === null || b.performancePct === null
        ? null
        : a.performancePct - b.performancePct,
  };
}
