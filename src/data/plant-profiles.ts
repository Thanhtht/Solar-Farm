import * as binh from "./binh-nguyen-layout";
import { assets as savaAssets, plant as savaPlant, type Asset } from "./plant";
import {
  hongLiemFields,
  hongLiemInverterPositions,
  photoToGround,
  inverterPads as hongPads,
  inverterForPV as hongInverterForPV,
  totalTableWeight as hongWeight,
  stationLocation,
} from "./hong-liem-layout";

export type PlantId = "sava" | "hong-liem-3" | "binh-nguyen";
export function parsePlantId(value: unknown): PlantId {
  if (value === undefined || value === "sava") return "sava";
  if (value === "hong-liem-3" || value === "binh-nguyen") return value;
  throw new Error("Nhà máy không hợp lệ");
}
const hongAssets: Asset[] = [];
for (const [index, field] of hongLiemFields.entries()) {
  const base = structuredClone(savaAssets.find((a) => a.type === "pv")!);
  const id = `PV-${String(index + 1).padStart(2, "0")}`;
  const capacity =
    (50 * field.rows.reduce((s, r) => s + r.capacityWeight, 0)) / hongWeight;
  base.id = id;
  base.name = `Vùng pin ${String(index + 1).padStart(2, "0")} · ${field.name}`;
  base.area = field.name;
  base.position = [field.center[0], 0, field.center[1]];
  base.related = [hongInverterForPV(id), "GW-01"];
  base.nominal = `${capacity.toFixed(3)} MWp DC · phân bổ giả định`;
  base.layoutNote = `${field.rows.length} dải pin · ${field.countBasis === "user-confirmed" ? "Số lượng người dùng xác nhận" : "Bố trí theo ảnh vệ tinh; số đoạn/kích thước ước lượng"} · đấu nối giả định`;
  base.attention = undefined;
  base.signals = base.signals.map((signal) => ({
    ...signal,
    id: `${id}.${signal.id.split(".")[1]}`,
    assetId: id,
    history: [],
    historyTimes: [],
    value: signal.id.endsWith(".temp") ? 44 + index * 0.25 : signal.value,
  }));
  hongAssets.push(base);
}
for (const pad of hongPads) {
  const base = structuredClone(savaAssets.find((a) => a.type === "inverter")!);
  const p = photoToGround(pad.photo),
    id = pad.id;
  base.id = id;
  base.name = `Inverter ${Number(id.slice(-2))} · bệ theo ảnh`;
  base.position = [p[0], 0.07, p[1]];
  base.area = pad.source;
  base.modelScale = [1.1, 0.27, 0.4];
  base.modelRotation = 0.32;
  base.related = [...pad.pvIds, "TR-01", "GW-01"];
  base.attention = undefined;
  base.nominal = "Phân bổ công suất demo theo vùng nối vào bệ";
  base.layoutNote =
    "Quy ước người dùng: 1 bệ = 1 inverter · vị trí theo ảnh vệ tinh, thông số/đấu nối giả định";
  base.signals = base.signals.map((signal) => ({
    ...signal,
    id: `${id}.${signal.id.split(".")[1]}`,
    assetId: id,
    history: [],
    historyTimes: [],
  }));
  hongAssets.push(base);
}
for (const kind of ["transformer", "weather", "gateway"] as const) {
  const base = structuredClone(savaAssets.find((a) => a.type === kind)!);
  const p =
    kind === "transformer"
      ? stationLocation
      : photoToGround(kind === "weather" ? [540, 441] : [541, 445]);
  base.position = [p[0], 0, p[1]];
  base.area = "Khu trạm theo ảnh vệ tinh";
  base.signals = base.signals.map((s) => ({
    ...s,
    history: [],
    historyTimes: [],
  }));
  base.layoutNote =
    "Thiết bị tham chiếu mô phỏng; chưa xác nhận danh mục từ ảnh";
  if (kind === "transformer") {
    base.modelScale = [0.5, 0.4, 0.5];
    base.related = hongPads.map((p) => p.id);
    base.nominal = `40 MW AC giả định · ${hongPads.length} bệ inverter`;
  }
  if (kind === "gateway") {
    base.nominal = `${hongLiemFields.length + hongPads.length + 2} nguồn thiết bị · heartbeat mô phỏng`;
    base.signals.find((s) => s.id.endsWith(".sources"))!.value =
      hongLiemFields.length + hongPads.length + 2;
  }
  hongAssets.push(base);
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
  delete base.modelScale;
  delete base.modelRotation;
  delete base.layoutNote;
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
  const layoutFields = plantId === "binh-nguyen" ? binh.fields : hongLiemFields;
  const inv = profile.assets.find((a) => a.id === inverterId)!;
  const totalWeight =
    plantId === "binh-nguyen" ? binh.totalTableWeight : hongWeight;
  const proportion =
    plantId === "sava"
      ? 1 / 8
      : layoutFields.reduce(
          (sum, f, i) =>
            inv.related.includes(`PV-${String(i + 1).padStart(2, "0")}`)
              ? sum + f.rows.reduce((s, r) => s + r.capacityWeight, 0)
              : sum,
          0,
        ) / totalWeight;
  return { dcMWp: profile.dcMWp * proportion, acMW: profile.acMW * proportion };
}

export function pvRating(pvId: string, plantId: PlantId = "sava") {
  const pv = getPlantProfile(plantId).assets.find(
    (a) => a.id === pvId && a.type === "pv",
  );
  if (!pv) throw new Error("Vùng pin không hợp lệ");
  if (plantId === "sava") return branchRating(pv.related[0], plantId);
  const fields = plantId === "binh-nguyen" ? binh.fields : hongLiemFields;
  const totalWeight =
    plantId === "binh-nguyen" ? binh.totalTableWeight : hongWeight;
  const field = fields[Number(pvId.slice(-2)) - 1],
    share = field.rows.reduce((s, r) => s + r.capacityWeight, 0) / totalWeight;
  return { dcMWp: 50 * share, acMW: 40 * share };
}
