import { createPerformanceHistory, historyRange } from "./performance-history";
import { historyModel } from "../data/history-model";
export function historyAnalysis(value: unknown, now: Date) {
  const v = value as {
    mode?: string;
    start?: string;
    end?: string;
    assetId?: string | null;
  };
  if (
    !v ||
    v.mode !== "history" ||
    typeof v.start !== "string" ||
    typeof v.end !== "string" ||
    (v.assetId !== null && typeof v.assetId !== "string")
  )
    throw new Error("Ngữ cảnh lịch sử không hợp lệ");
  const data = createPerformanceHistory({ now });
  const result = historyRange(
    data,
    { start: v.start, end: v.end },
    v.assetId ?? undefined,
  );
  return {
    key: JSON.stringify([
      "history",
      v.start,
      v.end,
      v.assetId,
      historyModel.version,
    ]),
    mode: "history",
    source: "Dữ liệu mô phỏng",
    range: result.range,
    assetId: v.assetId,
    summary: result.summary,
    byDay: result.byDay,
    byAsset: result.byAsset,
    events: data.days
      .filter(
        (d) =>
          d.date >= v.start! &&
          d.date <= v.end! &&
          (!v.assetId || d.assetId === v.assetId),
      )
      .flatMap((d) =>
        d.events.map((e) => ({
          date: d.date,
          assetId: d.assetId,
          label: e.label,
        })),
      )
      .slice(0, 64),
    findings: [] as import("./analysis").Finding[],
  };
}
