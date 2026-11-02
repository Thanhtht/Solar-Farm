import type { AssetType } from "./plant";

export const deviceModels: Record<AssetType, string> = {
  pv: "/pv-block/pv-block.glb",
  inverter: "/inverter/inverter.glb",
  transformer: "/transformer-station/transformer-station.glb",
  weather: "/weather-station/weather-station.glb",
  gateway: "/iot-gateway/iot-gateway.glb",
};
export const landscapeModels = {
  terrain: "/terrain/terrain.glb",
  road: "/sava-road-straight/road-straight.glb",
  corner: "/sava-road-corner/road-corner.glb",
  fence: "/sava-fence-segment/fence-segment.glb",
  gate: "/sava-gate/gate.glb",
  building: "/sava-control-building-v2/control-building.glb",
  treeA: "/sava-tree-a/tree-a.glb",
  treeB: "/sava-tree-b/tree-b.glb",
  treeC: "/sava-tree-c/tree-c.glb",
  shrubA: "/sava-shrub-a/shrub-a.glb",
  shrubB: "/sava-shrub-b/shrub-b.glb",
};
export type LandscapeKind = keyof typeof landscapeModels;
export type Placement = {
  position: [number, number, number];
  rotation?: number;
  scale?: [number, number, number];
};
export const allModelUrls = [
  ...Object.values(deviceModels),
  ...Object.values(landscapeModels),
];
const road = (
  x: number,
  z: number,
  length: number,
  rotation = 0,
  width = 3,
): Placement => ({
  position: [x, 0, z],
  rotation,
  scale: [length / 5, 1, width / 3],
});
const roads: Placement[] = [
  road(-2.5, 0, 58),
  road(-2.5, -17.5, 50),
  road(-2.5, 17.5, 50),
  road(0, 8.75, 14.5, Math.PI / 2, 2.5),
  road(0, 20.25, 2.5, Math.PI / 2, 2.5),
  road(30.5, -8, 8),
  road(27.4, 9, 1.8, 0, 1.5),
];
for (const x of [-30, 25])
  for (const z of [-8.25, 8.25]) roads.push(road(x, z, 13.5, Math.PI / 2));
const corners: Placement[] = [
  { position: [-30, 0, -17.5], rotation: Math.PI / 2 },
  { position: [25, 0, -17.5] },
  { position: [-30, 0, 17.5], rotation: Math.PI },
  { position: [25, 0, 17.5], rotation: -Math.PI / 2 },
];
const fences: Placement[] = [];
function fenceRun(start: number, end: number, fixed: number, vertical = false) {
  for (let at = start; at < end - 0.001; at += 5) {
    const length = Math.min(5, end - at);
    fences.push({
      position: vertical
        ? [fixed, 0, at + length / 2]
        : [at + length / 2, 0, fixed],
      rotation: vertical ? Math.PI / 2 : 0,
      scale: [length / 5, 1, 1],
    });
  }
}
fenceRun(-35, 35, -21.5);
fenceRun(-35, -2.645, 21.5);
fenceRun(2.645, 35, 21.5);
fenceRun(-21.5, 21.5, -35, true);
fenceRun(-21.5, 21.5, 35, true);
// Deterministic, sparse planting outside the fence; keep the entry and labels clear.
const trees: Placement[] = Array.from({ length: 12 }, (_, i) => ({
  position: [-49 + i * 8.5, 0, -30 - (i % 3) * 3],
  rotation: i * 0.71,
  scale: [0.85 + (i % 3) * 0.08, 0.9 + (i % 4) * 0.05, 0.85 + (i % 3) * 0.08],
}));
for (const side of [-1, 1])
  for (let i = 0; i < 5; i++)
    trees.push({
      position: [side * (43 + (i % 2) * 5), 0, -17 + i * 10],
      rotation: i * 0.9,
      scale: [0.9, 1, 0.9],
    });
const shrubs: Placement[] = Array.from({ length: 18 }, (_, i) => ({
  position: [-38 + i * 4.5, 0, i % 2 ? -25 : 27],
  rotation: i * 0.63,
  scale: [1, 1, 1],
}));
export const landscapePlacements: Record<LandscapeKind, Placement[]> = {
  terrain: [{ position: [0, 0, 0] }],
  road: roads,
  corner: corners,
  fence: fences,
  gate: [{ position: [0, 0, 21.5] }],
  building: [{ position: [31.5, 0, -12] }],
  treeA: trees.filter((_, i) => i % 3 === 0),
  treeB: trees.filter((_, i) => i % 3 === 1),
  treeC: trees.filter((_, i) => i % 3 === 2),
  shrubA: shrubs.filter((_, i) => i % 2 === 0),
  shrubB: shrubs.filter((_, i) => i % 2 === 1),
};
