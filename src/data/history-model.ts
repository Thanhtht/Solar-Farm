import { getPlantProfile, pvRating, type PlantId } from "./plant-profiles";

export const historyModel = {
  version: "daily-history-v2",
  seed: 20261104,
  intervalMinutes: 15,
  sunriseMinute: 6 * 60,
  sunsetMinute: 18 * 60,
  cycleDays: 28,
  cycleEpoch: "2026-10-04",
  temperatureCoefficient: -0.0035,
} as const;

export function getHistoryModel(plantId: PlantId = "sava") {
  return {
    ...historyModel,
    seed:
      plantId === "sava"
        ? historyModel.seed
        : plantId === "binh-nguyen"
          ? 20261112
          : 20261111,
  };
}
export function getHistoryBranches(plantId: PlantId = "sava") {
  const assets = getPlantProfile(plantId).assets;
  return assets
    .filter((a) => a.type === "pv")
    .map((pv) => {
      const inverterId = pv.related.find((id) =>
        assets.some((a) => a.id === id && a.type === "inverter"),
      )!;
      const rating = pvRating(pv.id, plantId);
      return {
        assetId: pv.id,
        inverterId,
        area: pv.area,
        nominalDCMWp: rating.dcMWp,
        acLimitMW: rating.acMW,
      };
    });
}
export const historyBranches = getHistoryBranches();
export type HistoryBranch = (typeof historyBranches)[number];

export type HistoryEventKind =
  | "soiling"
  | "cleaning"
  | "inverter-stop"
  | "recovery"
  | "data-gap"
  | "stale-data"
  | "invalid-data"
  | "branch-derating";
export type HistoryEvent = {
  kind: HistoryEventKind;
  label: string;
  startMinute: number;
  endMinute: number;
  factor?: number;
};

/** Authored simulation situations, not automatically detected anomalies. */
export function historyEvents(
  phase: number,
  assetId: string,
  plantId: PlantId = "sava",
): HistoryEvent[] {
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
  const inverterStopped =
    plantId === "hong-liem-3"
      ? getPlantProfile(plantId)
          .assets.find((a) => a.id === assetId)
          ?.related.includes("INV-03")
      : assetId === "PV-03";
  if (inverterStopped) {
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
    if (phase === 22) add("data-gap", "Mô phỏng mất dữ liệu cả ngày");
  }
  if (assetId === "PV-02") {
    if (phase === 24)
      add("stale-data", "Dữ liệu cũ từ 11:00 đến 12:00", 660, 720);
    if (phase === 25)
      add(
        "invalid-data",
        "Mô phỏng số đo bị lỗi kiểm tra chất lượng từ 13:00 đến 14:00",
        780,
        840,
      );
  }
  if (assetId === "PV-04") {
    if (phase <= 20)
      events.push({
        kind: "branch-derating",
        label: `Bụi tích lũy: giảm ${(12 + phase * 0.9).toFixed(0)}% công suất`,
        startMinute: 0,
        endMinute: 1440,
        factor: 0.88 - phase * 0.009,
      });
    if (phase === 21)
      add("cleaning", "Vệ sinh cụm pin, phục hồi công suất", 0, 360);
  }
  if (assetId === "PV-07") {
    if (phase <= 23) {
      const factor =
        phase >= 21
          ? 0.9
          : 0.65 + 0.2 * (0.5 + 0.5 * Math.cos((phase * Math.PI) / 10));
      events.push({
        kind: "branch-derating",
        label: `Nhánh DC giảm công suất ${Math.round((1 - factor) * 100)}%${phase >= 21 ? ", đang phục hồi" : ""}`,
        startMinute: 0,
        endMinute: 1440,
        factor,
      });
    }
    if (phase === 24) add("recovery", "Hoàn tất khôi phục nhánh DC", 0, 1440);
  }
  if (assetId === "PV-06" && phase % 7 <= 4)
    events.push({
      kind: "branch-derating",
      label: "Giới hạn công suất do nhiệt trong buổi trưa (25%)",
      startMinute: 660,
      endMinute: 900,
      factor: 0.75,
    });
  return events;
}
