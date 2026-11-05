import { resolveHistoryQuestion } from "./history-question";
import { createPerformanceHistory, historyRange } from "./performance-history";
import { historyModel } from "../data/history-model";
export function historyAnalysis(value: unknown, now: Date, question = "") {
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
  // Validate the original selection too; a question never repairs invalid input.
  historyRange(data, { start: v.start, end: v.end }, v.assetId ?? undefined);
  const resolved = resolveHistoryQuestion(
    { mode: "history", start: v.start, end: v.end, assetId: v.assetId },
    question,
    data.window,
  );
  const source = resolved.context;
  const result = historyRange(
    data,
    { start: source.start, end: source.end },
    source.assetId ?? undefined,
  );
  return {
    key: JSON.stringify([
      "history",
      source.start,
      source.end,
      source.assetId,
      historyModel.version,
    ]),
    mode: "history",
    source: "Dữ liệu mô phỏng",
    range: result.range,
    assetId: source.assetId,
    requestedRange: resolved.requestedRange,
    rangeNotice: resolved.rangeNotice,
    summary: result.summary,
    byDay: result.byDay,
    byAsset: result.byAsset,
    events: data.days
      .filter(
        (d) =>
          d.date >= source.start &&
          d.date <= source.end &&
          (!source.assetId || d.assetId === source.assetId),
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
