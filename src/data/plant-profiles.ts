import { assets as savaAssets, plant as savaPlant, type Asset } from "./plant";
import {
  hongLiemFields,
  hongLiemInverterPositions,
  photoToGround,
} from "./hong-liem-layout";

export type PlantId = "sava" | "hong-liem-3";
export function parsePlantId(value: unknown): PlantId {
  if (value === undefined || value === "sava") return "sava";
  if (value === "hong-liem-3") return value;
  throw new Error("Nhà máy không hợp lệ");
}
const rows = hongLiemFields.reduce((sum, field) => sum + field.rows.length, 0);
const hongAssets: Asset[] = hongLiemFields.flatMap((field, index) => {
  const n = String(index + 1).padStart(2, "0");
  const capacity = (50 * field.rows.length) / rows;
  const make = (type: "pv" | "inverter"): Asset => {
    const template = savaAssets.find((asset) => asset.type === type)!;
    const id = `${type === "pv" ? "PV" : "INV"}-${n}`;
    return {
      ...structuredClone(template),
      id,
      name: type === "pv" ? `Cụm pin ${n} · ${field.name}` : `Inverter ${n}`,
      area: field.name,
      layoutNote:
        type === "pv"
          ? `${field.rows.length} cụm nhỏ · ${field.countBasis === "user-confirmed" ? "Số lượng người dùng xác nhận" : `Ước lượng theo diện tích và hai vùng tham chiếu (khoảng ${field.estimatedRange[0]}–${field.estimatedRange[1]})`}`
          : undefined,
      position:
        type === "pv"
          ? [field.center[0], 0, field.center[1]]
          : [
              hongLiemInverterPositions[index][0],
              0,
              hongLiemInverterPositions[index][1],
            ],
      related:
        type === "pv" ? [`INV-${n}`, "GW-01"] : [`PV-${n}`, "TR-01", "GW-01"],
      nominal:
        type === "pv"
          ? `${capacity.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} MWp DC · vùng đại diện`
          : `${(capacity * 0.8).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} MW AC · giả định`,
      operation: "Bình thường",
      attention: undefined,
      signals: template.signals.map((signal) => ({
        ...structuredClone(signal),
        id: `${id}.${signal.id.split(".")[1]}`,
        assetId: id,
        history: [],
        historyTimes: [],
        value: signal.id.endsWith(".temp")
          ? type === "pv"
            ? 44 + index * 0.25
            : 48 + index * 0.2
          : signal.value,
      })),
    };
  };
  return [make("pv"), make("inverter")];
});
for (const type of ["transformer", "weather", "gateway"] as const) {
  const template = savaAssets.find((asset) => asset.type === type)!;
  const p = photoToGround(
    type === "transformer"
      ? [552, 128]
      : type === "weather"
        ? [591, 133]
        : [573, 139],
  );
  hongAssets.push({
    ...structuredClone(template),
    position: [p[0], 0, p[1]],
    area: "Khu trạm điện",
    related:
      type === "transformer"
        ? hongAssets.filter((a) => a.type === "inverter").map((a) => a.id)
        : template.related,
    nominal:
      type === "transformer"
        ? "40 MW AC giả định · tổng 12 inverter"
        : type === "gateway"
          ? "26 nguồn thiết bị · heartbeat mô phỏng"
          : template.nominal,
    signals: template.signals.map((signal) => ({
      ...structuredClone(signal),
      history: [],
      historyTimes: [],
      value: signal.id === "GW-01.sources" ? 26 : signal.value,
    })),
  });
}
const profiles = {
  sava: {
    ...savaPlant,
    plantId: "sava" as const,
    code: "SF-01",
    acMW: 40,
    assets: savaAssets,
    start: "2026-11-02T03:30:00.000Z",
    seed: 1,
    geometryNote: null as string | null,
  },
  "hong-liem-3": {
    ...savaPlant,
    plantId: "hong-liem-3" as const,
    id: "HL3",
    name: "Hồng Liêm 3",
    code: "HL3",
    acMW: 40,
    assets: hongAssets,
    start: "2026-11-11T03:30:00.000Z",
    seed: 3,
    geometryNote:
      "Bố cục theo ảnh · kích thước, cao độ và vị trí thiết bị ước lượng",
  },
};
export function getPlantProfile(plantId: PlantId = "sava") {
  return profiles[parsePlantId(plantId)];
}
export function branchRating(inverterId: string, plantId: PlantId = "sava") {
  const profile = getPlantProfile(plantId);
  const index = profile.assets
    .filter((asset) => asset.type === "inverter")
    .findIndex((asset) => asset.id === inverterId);
  if (index < 0) throw new Error("Inverter không thuộc nhà máy");
  const proportion =
    plantId === "sava" ? 1 / 8 : hongLiemFields[index].rows.length / rows;
  return { dcMWp: profile.dcMWp * proportion, acMW: profile.acMW * proportion };
}
