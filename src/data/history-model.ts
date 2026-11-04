import { assets } from "./plant";
import { baseline } from "../lib/simulation";

export const historyModel = {
  version: "daily-history-v1",
  seed: 20261104,
  intervalMinutes: 15,
  sunriseMinute: 6 * 60,
  sunsetMinute: 18 * 60,
  cycleDays: 28,
  cycleEpoch: "2026-10-04",
  temperatureCoefficient: -0.0035,
} as const;

// Derive topology and ratings from the existing registry/configuration.
const pvs = assets.filter((asset) => asset.type === "pv");
export const historyBranches = pvs.map((pv) => ({
  assetId: pv.id,
  inverterId: pv.related.find((id) =>
    assets.some((a) => a.id === id && a.type === "inverter"),
  )!,
  area: pv.area,
  nominalDCMWp: baseline.dcMWp / pvs.length,
  acLimitMW: Math.min(
    baseline.inverterLimitMW,
    baseline.acLimitMW / pvs.length,
  ),
}));
export type HistoryBranch = (typeof historyBranches)[number];

export type HistoryEventKind =
  | "soiling"
  | "cleaning"
  | "inverter-stop"
  | "recovery"
  | "data-gap"
  | "stale-data"
  | "invalid-data";
export type HistoryEvent = {
  kind: HistoryEventKind;
  label: string;
  startMinute: number;
  endMinute: number;
};

/** Authored simulation situations, not automatically detected anomalies. */
export function historyEvents(phase: number, assetId: string): HistoryEvent[] {
  const events: HistoryEvent[] = [];
  const add = (
    kind: HistoryEventKind,
    label: string,
    startMinute = 0,
    endMinute = 1440,
  ) => events.push({ kind, label, startMinute, endMinute });
  if (["PV-05", "PV-06"].includes(assetId)) {
    if (phase >= 3 && phase <= 12)
      add("soiling", "Bám bụi tăng dần trước vệ sinh");
    if (phase === 13) add("cleaning", "Đã vệ sinh trước giờ phát điện", 0, 360);
  }
  if (assetId === "PV-03") {
    if (phase === 16) add("inverter-stop", "Inverter dừng từ 10:00", 600);
    if (phase === 17) add("inverter-stop", "Inverter tiếp tục dừng cả ngày");
    if (phase === 18) {
      add("inverter-stop", "Inverter dừng đến 09:00", 0, 540);
      add("recovery", "Khôi phục phát điện từ 09:00", 540);
    }
  }
  if (assetId === "PV-08") {
    if (phase === 21)
      add("data-gap", "Thiếu dữ liệu từ 10:00 đến 13:00", 600, 780);
    if (phase === 22) add("data-gap", "Không có dữ liệu hợp lệ cả ngày");
  }
  if (assetId === "PV-02") {
    if (phase === 24)
      add("stale-data", "Dữ liệu cũ từ 11:00 đến 12:00", 660, 720);
    if (phase === 25)
      add("invalid-data", "Dữ liệu không hợp lệ từ 13:00 đến 14:00", 780, 840);
  }
  return events;
}
