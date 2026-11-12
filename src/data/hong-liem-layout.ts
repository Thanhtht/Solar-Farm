import type { Placement } from "./scene-layout";
import {
  satelliteRegions,
  satellitePads,
  satelliteRoads,
} from "./hong-liem-satellite";
export type Point2 = [number, number];
export const referencePhoto = { width: 656, height: 745 };
export const hongLiemCamera: [number, number, number] = [0, 295, 125];
export const photoToGround = ([x, y]: Point2): Point2 => [
  (x - 330) * 0.32,
  (y - 370) * 0.32,
];
export function insidePolygon([x, z]: Point2, polygon: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

export const vegetationIsland: Point2[] = [
  [230, 228],
  [324, 250],
  [361, 359],
  [368, 388],
  [328, 425],
  [256, 399],
  [224, 426],
  [158, 401],
  [78, 394],
].map((p) => photoToGround(p as Point2));
export const pvRowRotation = -Math.atan2(0.95, 0.31);
export const pvRowScale: [number, number, number] = [
  (9.5 * 0.32) / 9,
  0.4,
  (1.8 * 0.32) / 9.8,
];
export const confirmedHongLiemCounts: Record<string, number> = {
  "PV-11": 7,
  "PV-12": 6,
};
export const inverterPads = satellitePads;
export const inverterForPV = (id: string) =>
  inverterPads.find((p) => p.pvIds.includes(id))!.id;
export const polygonArea = (p: Point2[]) =>
  Math.abs(
    p.reduce((s, a, i) => {
      const b = p[(i + 1) % p.length];
      return s + a[0] * b[1] - b[0] * a[1];
    }, 0),
  ) / 2;
const norm = Math.hypot(0.31, 0.95),
  dx = 0.31 / norm,
  dy = 0.95 / norm;
const local = ([x, y]: Point2): Point2 => [x * dy - y * dx, x * dx + y * dy];
const image = ([u, v]: Point2): Point2 => [u * dy + v * dx, -u * dx + v * dy];
const totalTaken: { polygon: Point2[] }[] = [];
export const hongLiemFields = satelliteRegions.map((region, index) => {
  const polygon = region.polygon.map(photoToGround);
  const bounds = region.polygon.map(local);
  const minU = region.confirmed
      ? Math.max(bounds[0][0], bounds[3][0])
      : Math.min(...bounds.map((p) => p[0])),
    maxU = region.confirmed
      ? Math.min(bounds[1][0], bounds[2][0])
      : Math.max(...bounds.map((p) => p[0]));
  const minV = Math.min(...bounds.map((p) => p[1])),
    maxV = Math.max(...bounds.map((p) => p[1]));
  const rows: (Placement & {
    photoBounds: Point2[];
    capacityWeight: number;
  })[] = [];
  const permitted = (u: number, v: number) => {
    const p = image([u, v]);
    if (!insidePolygon(p, region.polygon)) return false;
    if (
      inverterPads.some((pad) => {
        const [a, b, c, d] = pad.bounds;
        return (
          (p[0] >= a - 0.5 &&
            p[0] <= c + 0.5 &&
            p[1] >= b - 0.5 &&
            p[1] <= d + 0.5) ||
          distanceToSegment(p, pad.photo, pad.access) < 2
        );
      })
    )
      return false;
    if (
      satelliteRoads.some((road) =>
        road.slice(1).some((b, i) => distanceToSegment(p, road[i], b) < 1.8),
      )
    )
      return false;
    // Existing region IDs are geographic monitoring areas, not extra hardware.
    return !totalTaken.some((r) => insidePolygon(p, r.polygon));
  };
  const width = region.confirmed
    ? ((maxU - minU) / region.confirmed) * 0.72
    : 1.8;
  const columns = region.confirmed
    ? Array.from(
        { length: region.confirmed },
        (_, i) => minU + ((i + 0.5) * (maxU - minU)) / region.confirmed,
      )
    : Array.from(
        { length: Math.max(1, Math.floor((maxU - minU - 1.8) / 2.45) + 1) },
        (_, i) => minU + 0.95 + i * 2.45,
      );
  for (const u of columns) {
    let start: number | null = null;
    const runs: [number, number][] = [];
    for (let v = minV; v <= maxV + 0.25; v += 0.25) {
      const good = permitted(u - width / 2, v) && permitted(u + width / 2, v);
      if (good && start === null) start = v;
      if (!good && start !== null) {
        if (v - start > 0.9) runs.push([start, v - 0.25]);
        start = null;
      }
    }
    for (const [a, b] of runs) {
      const cuts: [number, number][] = [];
      if (region.confirmed) cuts.push([a, b]);
      else
        for (let start = a; start < b; start += 9.7) {
          const stop = Math.min(b, start + 9.5);
          if (stop - start > 2.4) cuts.push([start, stop]);
        }
      for (const [a, b] of cuts) {
        const corners = [
          image([u - width / 2, a]),
          image([u + width / 2, a]),
          image([u + width / 2, b]),
          image([u - width / 2, b]),
        ];
        if (!corners.every((p) => insidePolygon(p, region.polygon))) continue;
        const centre = image([u, (a + b) / 2]),
          p = photoToGround(centre);
        rows.push({
          position: [p[0], 0.1, p[1]],
          rotation: pvRowRotation,
          scale: [((b - a) * 0.32) / 9, 0.4, (width * 0.32) / 9.8],
          photoBounds: corners,
          capacityWeight: (b - a) * width,
        });
      }
    }
  }
  totalTaken.push(region);
  if (!rows.length) throw new Error(`Vùng PV-${index + 1} không có dải pin`);
  const center: Point2 = [
    rows.reduce((s, r) => s + r.position[0], 0) / rows.length,
    rows.reduce((s, r) => s + r.position[2], 0) / rows.length,
  ];
  return {
    id: `HL3-PV-${String(index + 1).padStart(2, "0")}`,
    name: region.name,
    photoPolygon: region.polygon,
    polygon,
    rows,
    center,
    inverter: photoToGround(
      inverterPads.find((p) =>
        p.pvIds.includes(`PV-${String(index + 1).padStart(2, "0")}`),
      )!.photo,
    ),
    countBasis: region.confirmed
      ? ("user-confirmed" as const)
      : ("satellite-trace" as const),
    estimatedRange: [rows.length, rows.length],
  };
});
export const totalTableWeight = hongLiemFields.reduce(
  (s, f) => s + f.rows.reduce((n, r) => n + r.capacityWeight, 0),
  0,
);
export const hongLiemInverterPositions = inverterPads.map((p) =>
  photoToGround(p.photo),
);
export const roadTraces = satelliteRoads.map((r) => r.map(photoToGround));
export const serviceYard: Point2[] = [
  [518, 415],
  [543, 409],
  [552, 443],
  [529, 456],
  [517, 440],
].map((p) => photoToGround(p as Point2));
export const buildingLocation = photoToGround([533, 424]);
export const stationLocation = photoToGround([536, 440]);
export function segments(
  points: Point2[],
  width: number,
  modelLength = 5,
  modelWidth = 3,
  closed = false,
): Placement[] {
  const result: Placement[] = [];
  const list = closed ? [...points, points[0]] : points;
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1],
      b = list[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    result.push({
      position: [(a[0] + b[0]) / 2, 0.04, (a[1] + b[1]) / 2],
      rotation: -Math.atan2(b[1] - a[1], b[0] - a[0]),
      scale: [length / modelLength, 0.3, width / modelWidth],
    });
  }
  return result;
}

// Broad site envelope includes the photographed access corridors and equipment.
export const hongLiemBoundary: Point2[] = [
  [105, 5],
  [300, 5],
  [450, 170],
  [647, 258],
  [646, 330],
  [557, 343],
  [554, 467],
  [535, 534],
  [460, 613],
  [422, 665],
  [384, 704],
  [332, 746],
  [256, 744],
  [232, 725],
  [214, 496],
  [113, 445],
  [133, 239],
  [103, 132],
].map((p) => photoToGround(p as Point2));
export const hongLiemRoads = roadTraces.flatMap((r) => segments(r, 1));
export const hongLiemFence = segments(hongLiemBoundary, 0.35, 5, 1, true);
export const hongLiemTrees: Placement[] = [];
for (let i = 0; i < 180; i++) {
  const point = photoToGround([
    35 + ((i * 137.5) % 590),
    15 + ((i * 79.3) % 710),
  ]);
  if (!insidePolygon(point, hongLiemBoundary))
    hongLiemTrees.push({
      position: [point[0], 0, point[1]],
      rotation: i * 0.8,
      scale: [0.4, 0.35, 0.4],
    });
}
export function distanceToSegment(point: Point2, a: Point2, b: Point2): number {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) /
        (dx * dx + dz * dz || 1),
    ),
  );
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dz);
}
export function outsidePolygon(
  point: Point2,
  polygon: Point2[],
  clearance = 0,
): boolean {
  return (
    !insidePolygon(point, polygon) &&
    polygon.every(
      (p, i) =>
        distanceToSegment(point, p, polygon[(i + 1) % polygon.length]) >=
        clearance,
    )
  );
}

export const collectorCircuits = [
  {
    prefix: "HL3-N",
    inverters: ["INV-01", "INV-02", "INV-03"],
    guides: roadTraces[1],
    tapOverrides: {} as Record<string, Point2>,
  },
  {
    prefix: "HL3-S",
    inverters: ["INV-04", "INV-05"],
    guides: roadTraces[0],
    tapOverrides: { "INV-04": photoToGround([527, 451]) } as Record<
      string,
      Point2
    >,
  },
];
