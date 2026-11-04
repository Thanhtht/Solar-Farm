/** Calendar dates in the plant timezone, never browser-local midnight instants. */
export type DateRange = { start: string; end: string };
export type HistoryWindow = DateRange & { today: string; timezone: string };
export type HistoryPreset = "1d" | "3d" | "7d" | "all";
export const HISTORY_TIMEZONE = "Asia/Bangkok";
const DAY_MS = 86_400_000;

export function calendarDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError("Ngày phải có định dạng YYYY-MM-DD.");
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  )
    throw new RangeError("Ngày không hợp lệ.");
  return value;
}

export function dateNumber(value: string): number {
  return Date.parse(`${calendarDate(value)}T00:00:00.000Z`) / DAY_MS;
}

export function shiftDate(value: string, days: number): string {
  if (!Number.isSafeInteger(days))
    throw new RangeError("Số ngày không hợp lệ.");
  return new Date((dateNumber(value) + days) * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function datesInRange(range: DateRange): string[] {
  const count = dateNumber(range.end) - dateNumber(range.start) + 1;
  if (count < 1 || count > 366)
    throw new RangeError("Khoảng ngày phải tăng dần và không quá 366 ngày.");
  return Array.from({ length: count }, (_, i) => shiftDate(range.start, i));
}

/** Previous calendar month anniversary through yesterday; clamp month-end. */
export function historyWindow(
  now: Date,
  timezone = HISTORY_TIMEZONE,
): HistoryWindow {
  if (!Number.isFinite(now.getTime()))
    throw new RangeError("Thời gian không hợp lệ.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const today = calendarDate(`${part("year")}-${part("month")}-${part("day")}`);
  const date = new Date(`${today}T00:00:00.000Z`);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0),
  );
  lastDay.setUTCDate(Math.min(date.getUTCDate(), lastDay.getUTCDate()));
  return {
    today,
    start: lastDay.toISOString().slice(0, 10),
    end: shiftDate(today, -1),
    timezone,
  };
}

export function validateHistoryRange(
  range: DateRange,
  window: HistoryWindow,
): DateRange {
  calendarDate(range.start);
  calendarDate(range.end);
  if (
    range.start > range.end ||
    range.start < window.start ||
    range.end > window.end ||
    range.end >= window.today
  )
    throw new RangeError(
      "Chỉ chọn ngày trong lịch sử, từ đầu cửa sổ đến hôm qua.",
    );
  return { ...range };
}

export function historyPreset(
  preset: HistoryPreset,
  window: HistoryWindow,
): DateRange {
  if (preset === "all")
    return validateHistoryRange(
      { start: window.start, end: window.end },
      window,
    );
  const count = { "1d": 1, "3d": 3, "7d": 7 }[preset];
  if (!count) throw new RangeError("Chế độ thời gian không hợp lệ.");
  return validateHistoryRange(
    {
      start: shiftDate(window.end, 1 - count),
      end: window.end,
    },
    window,
  );
}

/** Do not clip: callers can report an unavailable comparison honestly. */
export function previousPeriod(range: DateRange): DateRange {
  const count = datesInRange(range).length;
  return {
    start: shiftDate(range.start, -count),
    end: shiftDate(range.start, -1),
  };
}
