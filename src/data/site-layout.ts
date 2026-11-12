import * as hong from "./hong-liem-layout";
import * as binh from "./binh-nguyen-layout";
import { hongLiemBlocks } from "./hong-liem-blocks";
import type { PlantId } from "./plant-profiles";
export const hongLayout = {
  fields: hong.hongLiemFields,
  boundary: hong.hongLiemBoundary,
  groundPatches: [hong.hongLiemBoundary],
  vegetationIsland: hong.vegetationIsland,
  serviceYard: hong.serviceYard,
  roads: hong.hongLiemRoads,
  fence: hong.hongLiemFence,
  trees: hong.hongLiemTrees,
  building: hong.photoToGround([574, 126]),
  pvRowScale: hong.pvRowScale,
  pvRowRotation: hong.pvRowRotation,
  camera: hong.hongLiemCamera,
};
export function getSiteLayout(id: PlantId = "hong-liem-3") {
  return id === "binh-nguyen" ? binh : hongLayout;
}
const binhBlocks = binh.fields.flatMap((f, fieldIndex) =>
  f.rows.map((placement, index) => ({
    id: `PV-${String(fieldIndex + 1).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`,
    parentId: `PV-${String(fieldIndex + 1).padStart(2, "0")}`,
    name: `Cụm pin nhỏ ${index + 1} · ${f.name}`,
    area: f.name,
    type: "pv" as const,
    index,
    fieldIndex,
    placement,
  })),
);
const blocks = {
  sava: [],
  "hong-liem-3": hongLiemBlocks,
  "binh-nguyen": binhBlocks,
};
const maps = Object.fromEntries(
  Object.entries(blocks).map(([k, v]) => [k, new Map(v.map((b) => [b.id, b]))]),
);
export const getSiteBlocks = (id: PlantId = "sava") => blocks[id];
export const getSiteBlock = (
  id: PlantId,
  assetId: string | null | undefined,
) => (assetId ? maps[id].get(assetId) : undefined);
