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
  building: hong.buildingLocation,
  buildings: [
    {
      position: [hong.buildingLocation[0], 0.1, hong.buildingLocation[1]] as [
        number,
        number,
        number,
      ],
      scale: [0.25, 0.3, 0.25] as [number, number, number],
    },
  ],
  inverterPads: hong.inverterPads,
  photoToGround: hong.photoToGround,
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

export function siteTableShare(
  id: PlantId,
  fieldIndex: number,
  index: number,
): number {
  const field = getSiteLayout(id).fields[fieldIndex];
  if (id === "sava") return 1 / field.rows.length;
  const tables = field.rows;
  return (
    tables[index].capacityWeight /
    tables.reduce((s, t) => s + t.capacityWeight, 0)
  );
}
