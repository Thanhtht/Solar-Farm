import * as binh from "./binh-nguyen-layout";
import { assets as savaAssets, plant as savaPlant, type Asset } from "./plant";
import {
  hongLiemFields,
  hongLiemInverterPositions,
  photoToGround,
} from "./hong-liem-layout";

export type PlantId = "sava" | "hong-liem-3" | "binh-nguyen";
export function parsePlantId(value: unknown): PlantId {
  if (value === undefined || value === "sava") return "sava";
  if (value === "hong-liem-3" || value === "binh-nguyen") return value;
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
const binhAssets: Asset[] = [];
for (const [index, field] of binh.fields.entries()) {
  const base = structuredClone(
    hongAssets.find(
      (a) => a.id === `PV-${String(index + 1).padStart(2, "0")}`,
    )!,
  );
  base.name = `Vùng pin ${index + 1} · ${field.name}`;
  base.area = field.name;
  base.position = [field.center[0], 0, field.center[1]];
  base.related = [binh.inverterForPV(base.id), "GW-01"];
  base.layoutNote = `${field.rows.length} đoạn pin · Ước lượng theo ảnh; kết nối điện giả định`;
  base.nominal = `${((50 * field.rows.reduce((s, r) => s + r.capacityWeight, 0)) / binh.totalTableWeight).toFixed(3)} MWp DC · giả định`;
  binhAssets.push(base);
}
for (const pad of binh.inverterPads) {
  const base = structuredClone(savaAssets.find((a) => a.type === "inverter")!),
    id = pad.id,
    p = binh.photoToGround(pad.photo);
  base.id = id;
  base.name = `Inverter ${Number(id.slice(-2))} · bệ theo ảnh`;
  base.position = [p[0], 0.07, p[1]];
  base.area = pad.source;
  base.modelScale = [2, 0.55, 0.7];
  base.modelRotation = 0;
  base.related = [...pad.pvIds, "TR-01", "GW-01"];
  base.attention = undefined;
  base.layoutNote =
    "Quy ước người dùng: 1 bệ = 1 inverter · vị trí theo ảnh, thông số/đấu nối giả định";
  base.nominal = "Phân bổ công suất demo theo các vùng nối vào bệ";
  base.signals = base.signals.map((signal) => ({
    ...signal,
    id: `${id}.${signal.id.split(".")[1]}`,
    assetId: id,
    history: [],
    historyTimes: [],
  }));
  binhAssets.push(base);
}
for (const kind of ["transformer", "weather", "gateway"] as const) {
  const base = structuredClone(hongAssets.find((a) => a.type === kind)!);
  const p =
    kind === "transformer"
      ? binh.station
      : binh.photoToGround(kind === "weather" ? [513, 134] : [501, 139]);
  base.position = [p[0], 0, p[1]];
  base.area = "Khu trạm Bắc";
  if (kind === "transformer") {
    base.related = binh.inverterPads.map((p) => p.id);
    base.nominal = "40 MW AC giả định · 7 inverter theo bệ";
  }
  if (kind === "gateway") {
    base.nominal = "21 nguồn thiết bị · heartbeat mô phỏng";
    base.signals.find((s) => s.id.endsWith(".sources"))!.value = 21;
  }
  binhAssets.push(base);
}
const profiles = {
  "binh-nguyen": {
    ...savaPlant,
    plantId: "binh-nguyen" as const,
    id: "BN",
    name: "Bình Nguyên",
    code: "BN",
    dcMWp: 50,
    acMW: 40,
    assets: binhAssets,
    start: "2026-11-12T03:30:00.000Z",
    seed: 7,
    geometryNote:
      "Bố cục theo hai ảnh · số cụm/kích thước ước lượng · 50 MWp/40 MW AC giả định",
  },
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
    plantId === "sava"
      ? 1 / 8
      : plantId === "binh-nguyen"
        ? binh.fields
            .filter((_, i) =>
              binh.inverterPads[index].pvIds.includes(
                `PV-${String(i + 1).padStart(2, "0")}`,
              ),
            )
            .reduce(
              (sum, f) =>
                sum + f.rows.reduce((s, r) => s + r.capacityWeight, 0),
              0,
            ) / binh.totalTableWeight
        : hongLiemFields[index].rows.length / rows;
  return { dcMWp: profile.dcMWp * proportion, acMW: profile.acMW * proportion };
}

export function pvRating(pvId: string, plantId: PlantId = "sava") {
  const pv = getPlantProfile(plantId).assets.find(
    (a) => a.id === pvId && a.type === "pv",
  );
  if (!pv) throw new Error("Vùng pin không hợp lệ");
  if (plantId !== "binh-nguyen") return branchRating(pv.related[0], plantId);
  const field = binh.fields[Number(pvId.slice(-2)) - 1],
    share =
      field.rows.reduce((s, r) => s + r.capacityWeight, 0) /
      binh.totalTableWeight;
  return { dcMWp: 50 * share, acMW: 40 * share };
}
