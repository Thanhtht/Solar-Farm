import {
  inverterPads,
  photoToGround as binhGround,
} from "../data/binh-nguyen-layout";
import { routeBinhRoad, binhCollector } from "./binh-nguyen-cables";
import { collectSouthernAC } from "./hong-liem-bus";
import { routeHongCable, closestCollector } from "./hong-liem-cables";
import type { PlantId } from "../data/plant-profiles";
import type { Asset } from "../data/plant";

export type PowerPoint = [number, number, number];
export type PowerLink = {
  id: string;
  from: string;
  to: string;
  kind: "DC" | "AC";
  state: "normal" | "degraded" | "stopped" | "unknown";
  powerMW: number | null;
  running: boolean;
  points: PowerPoint[];
  role?: "trunk" | "branch";
  contributors?: string[];
};
export const powerColors = {
  normal: "#008b65",
  degraded: "#e9b323",
  stopped: "#e44538",
  unknown: "#7b8c96",
} as const;

const hasProblem = (asset: Asset) =>
  Boolean(
    asset.attention ||
    asset.scenario ||
    asset.operatingState ||
    ["Sự cố", "Suy giảm", "Dừng"].includes(asset.operation) ||
    asset.signals.some(
      (signal) =>
        signal.id.endsWith(".fault") &&
        signal.quality === "valid" &&
        (signal.value ?? 0) > 0,
    ),
  );

// Schematic cable trays calibrated to the approved GLB footprints; not an as-built plan.
export function buildPowerLinks(
  assets: Asset[],
  plantId: PlantId = "sava",
): PowerLink[] {
  const links: PowerLink[] = [];
  const find = (id: string) => assets.find((asset) => asset.id === id);
  const add = (
    from: Asset,
    to: Asset,
    kind: PowerLink["kind"],
    points: PowerPoint[],
    branch: Asset[],
  ) => {
    const signal = from.signals.find((signal) =>
      signal.id.endsWith(kind === "DC" ? ".pdc" : ".pac"),
    );
    const powerMW =
      signal?.quality === "valid" &&
      signal.value !== null &&
      Number.isFinite(signal.value)
        ? signal.value / (signal.unit === "kW" ? 1000 : 1)
        : null;
    const fault = branch.some(
      (asset) =>
        asset.operatingState === "stopped" ||
        asset.signals.some(
          (signal) =>
            signal.id.endsWith(".fault") &&
            signal.quality === "valid" &&
            (signal.value ?? 0) > 0,
        ),
    );
    const stopped = fault || (powerMW === 0 && branch.some(hasProblem));
    links.push({
      id: `${from.id}->${to.id}`,
      from: from.id,
      to: to.id,
      kind,
      state: stopped
        ? "stopped"
        : powerMW === null
          ? "unknown"
          : branch.some(hasProblem)
            ? "degraded"
            : "normal",
      powerMW,
      running: !stopped && powerMW !== null && powerMW > 0,
      points,
    });
  };
  for (const pv of assets.filter((asset) => asset.type === "pv")) {
    const inverter = pv.related
      .map(find)
      .find((asset) => asset?.type === "inverter");
    if (!inverter) continue;
    const [x, y, z] = pv.position;
    const [ix, iy, iz] = inverter.position;
    add(
      pv,
      inverter,
      "DC",
      [
        [x + 4.45, y + 0.28, z],
        [x + 5.15, y + 0.28, z],
        [x + 5.15, iy + 0.28, iz - 1],
        [ix, iy + 0.28, iz - 1],
        [ix, iy + 0.28, iz - 0.5],
      ],
      [pv, inverter],
    );
  }
  assets
    .filter((asset) => asset.type === "inverter")
    .forEach((inverter, index) => {
      const transformer = inverter.related
        .map(find)
        .find((asset) => asset?.type === "transformer");
      if (!transformer) return;
      const pvs = assets.filter(
        (asset) =>
          asset.type === "pv" &&
          !asset.parentId &&
          asset.related.includes(inverter.id),
      );
      const [x, y, z] = inverter.position;
      const [tx, ty, tz] = transformer.position;
      const laneZ = z + 1.3 + (index % 4) * 0.34;
      const trunkX = tx - 6 + index * 0.34;
      const portZ = tz + (index - 3.5) * 0.25;
      add(
        inverter,
        transformer,
        "AC",
        [
          [x, y + 0.28, z + 0.5],
          [x, y + 0.28, laneZ],
          [trunkX, y + 0.28, laneZ],
          [trunkX, ty + 0.28, portZ],
          [tx - 1.95, ty + 0.28, portZ],
        ],
        [inverter, transformer, ...pvs],
      );
    });
  if (plantId === "binh-nguyen") {
    for (const link of links) {
      const from = find(link.from)!,
        to = find(link.to)!;
      const end: [number, number] = [
        to.position[0] - (link.kind === "AC" ? 2 : 0),
        to.position[2] - (link.kind === "DC" ? 0.55 : 0),
      ];
      const start: [number, number] =
        link.kind === "DC"
          ? from.parentId
            ? [from.position[0], from.position[2]]
            : binhCollector(from.id, end)
          : [from.position[0], from.position[2] + 0.55];
      const pad = inverterPads.find(
        (p) => p.id === (link.kind === "AC" ? from.id : to.id),
      )!;
      const access = binhGround(pad.access);
      const path =
        link.kind === "AC"
          ? [start, ...routeBinhRoad(access, end)]
          : [
              start,
              ...routeBinhRoad(
                from.parentId
                  ? binhCollector(from.parentId, access)
                  : binhCollector(from.id, access),
                access,
              ),
              end,
            ];
      link.points = path
        .filter(
          (p, i) =>
            i === 0 ||
            Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) > 1e-6,
        )
        .map(([x, z]) => [x, 0.24, z]);
    }
  }
  if (plantId === "hong-liem-3") {
    for (const link of links) {
      const from = find(link.from)!,
        to = find(link.to)!;
      const end: PowerPoint =
        link.kind === "DC"
          ? [to.position[0], 0.24, to.position[2] - 0.55]
          : [to.position[0] - 2, 0.24, to.position[2]];
      const start2: [number, number] =
        link.kind === "DC"
          ? from.parentId
            ? [from.position[0], from.position[2]]
            : closestCollector(from.id, [end[0], end[2]])
          : [from.position[0], from.position[2] + 0.55];
      const path = routeHongCable(
        start2,
        [end[0], end[2]],
        link.kind === "DC" ? (from.parentId ?? from.id) : undefined,
      );
      link.points = path.map(([x, z]) => [x, 0.24, z]);
    }
  }
  return plantId === "hong-liem-3" ? collectSouthernAC(links, assets) : links;
}
