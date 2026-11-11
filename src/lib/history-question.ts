import { type PlantId } from "../data/plant-profiles";
import { referencedAssets } from "./assistant-actions";
import {
  calendarDate,
  shiftDate,
  validateHistoryRange,
  type DateRange,
  type HistoryWindow,
} from "./history-dates";

export type HistoryContext = DateRange & {
  plantId?: PlantId;
  mode: "history";
  assetId: string | null;
};

/** Resolve explicit question scope before aggregation, shared by browser and server. */
export function resolveHistoryQuestion(
  source: HistoryContext,
  question: string,
  window: HistoryWindow,
) {
  validateHistoryRange(source, window);
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
  const ids = referencedAssets(question, source.plantId).filter((id) =>
    id.startsWith("PV-"),
  );
  let requested: DateRange = { start: source.start, end: source.end };
  if (
    /(?:toan bo lich su|toan (?:bo )?thang du lieu|mot thang gan nhat)/.test(q)
  ) {
    requested = { start: window.start, end: window.end };
  } else if (/\bthang\b/.test(q)) {
    let month = source.end.slice(0, 7);
    if (/thang nay/.test(q)) month = window.today.slice(0, 7);
    else if (/thang truoc/.test(q))
      month = shiftDate(`${window.today.slice(0, 7)}-01`, -1).slice(0, 7);
    else {
      const explicit = q.match(
        /thang\s+(\d{1,2})(?:\s*(?:\/|nam)\s*(\d{4}))?\b/,
      );
      if (explicit)
        month = `${explicit[2] ?? source.end.slice(0, 4)}-${explicit[1].padStart(2, "0")}`;
      else if (
        !/(?:trong thang|theo thang|ca thang|toan thang|thang dang (?:xem|chon))/.test(
          q,
        )
      )
        throw new Error(
          "Chưa xác định được tháng cần hỏi. Hãy nêu tháng dạng 10/2026 hoặc chọn Khoảng thời gian.",
        );
    }
    const start = calendarDate(`${month}-01`);
    const next = new Date(`${start}T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    requested = { start, end: shiftDate(next.toISOString().slice(0, 10), -1) };
  }
  const range = {
    start: requested.start < window.start ? window.start : requested.start,
    end: requested.end > window.end ? window.end : requested.end,
  };
  if (range.start > range.end)
    throw new Error(
      `Không có dữ liệu cho thời gian được hỏi. Lịch sử hiện có từ ${window.start} đến ${window.end}.`,
    );
  validateHistoryRange(range, window);
  return {
    context: {
      ...(source.plantId ? { plantId: source.plantId } : {}),
      mode: "history" as const,
      ...range,
      assetId:
        ids.length === 1 ? ids[0] : ids.length > 1 ? null : source.assetId,
    },
    requestedRange: requested,
    rangeNotice:
      requested.start !== range.start || requested.end !== range.end
        ? `Chỉ có dữ liệu ${range.start} – ${range.end} trong kỳ yêu cầu ${requested.start} – ${requested.end}; không đại diện cho toàn kỳ.`
        : null,
  };
}
