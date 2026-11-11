import type { Point2 } from "../data/hong-liem-layout";
import {
  hongLiemBoundary,
  hongLiemFields,
  insidePolygon,
  outsidePolygon,
  vegetationIsland,
  roadTraces,
  distanceToSegment,
  photoToGround,
} from "../data/hong-liem-layout";

const pitch = 1.5;
const minX =
  Math.floor(Math.min(...hongLiemBoundary.map((p) => p[0])) / pitch) * pitch -
  pitch;
const minZ =
  Math.floor(Math.min(...hongLiemBoundary.map((p) => p[1])) / pitch) * pitch -
  pitch;
const width =
  Math.ceil((Math.max(...hongLiemBoundary.map((p) => p[0])) - minX) / pitch) +
  2;
const height =
  Math.ceil((Math.max(...hongLiemBoundary.map((p) => p[1])) - minZ) / pitch) +
  2;
const houseCenter = photoToGround([574, 126]);
const house: Point2[] = [
  [-4.4, -3],
  [4.4, -3],
  [4.4, 3],
  [-4.4, 3],
].map(([x, z]) => [
  houseCenter[0] + x * Math.cos(-0.5) + z * Math.sin(-0.5),
  houseCenter[1] - x * Math.sin(-0.5) + z * Math.cos(-0.5),
]);
const roadSegments = roadTraces.flatMap((trace) =>
  trace.slice(1).map((p, i) => [trace[i], p] as [Point2, Point2]),
);
export function cablePointClear(point: Point2, allowedField?: string): boolean {
  return (
    insidePolygon(point, hongLiemBoundary) &&
    outsidePolygon(point, vegetationIsland, 0.3) &&
    outsidePolygon(point, house, 0.25) &&
    hongLiemFields.every(
      (field, index) =>
        `PV-${String(index + 1).padStart(2, "0")}` === allowedField ||
        outsidePolygon(point, field.polygon, 0.25),
    )
  );
}
export function cableSegmentClear(
  a: Point2,
  b: Point2,
  allowedField?: string,
): boolean {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 0.4),
  );
  for (let i = 0; i <= steps; i++)
    if (
      !cablePointClear(
        [
          a[0] + ((b[0] - a[0]) * i) / steps,
          a[1] + ((b[1] - a[1]) * i) / steps,
        ],
        allowedField,
      )
    )
      return false;
  return true;
}
const grids = new Map<string, { free: Uint8Array; cost: Float32Array }>();
function pointAt(index: number): Point2 {
  return [
    minX + (index % width) * pitch,
    minZ + Math.floor(index / width) * pitch,
  ];
}
function gridFor(allowedField?: string) {
  const key = allowedField ?? "AC";
  const cached = grids.get(key);
  if (cached) return cached;
  const free = new Uint8Array(width * height),
    cost = new Float32Array(width * height);
  for (let i = 0; i < free.length; i++) {
    const point = pointAt(i);
    if (!cablePointClear(point, allowedField)) continue;
    free[i] = 1;
    const distance = Math.min(
      ...roadSegments.map(([a, b]) => distanceToSegment(point, a, b)),
    );
    cost[i] = 1 + Math.min(3, distance / 12);
  }
  const grid = { free, cost };
  if (grids.size >= 3) grids.delete(grids.keys().next().value!);
  grids.set(key, grid);
  return grid;
}
class Heap {
  values: { index: number; score: number }[] = [];
  push(index: number, score: number) {
    let i = this.values.length;
    this.values.push({ index, score });
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.values[p].score <= score) break;
      this.values[i] = this.values[p];
      i = p;
    }
    this.values[i] = { index, score };
  }
  pop() {
    const first = this.values[0],
      last = this.values.pop()!;
    if (this.values.length) {
      let i = 0;
      while (i * 2 + 1 < this.values.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.values.length &&
          this.values[child + 1].score < this.values[child].score
        )
          child++;
        if (this.values[child].score >= last.score) break;
        this.values[i] = this.values[child];
        i = child;
      }
      this.values[i] = last;
    }
    return first;
  }
}
const routeCache = new Map<string, Point2[]>();
export function routeHongCable(
  start: Point2,
  end: Point2,
  allowedField?: string,
): Point2[] {
  const key = JSON.stringify([start, end, allowedField]);
  const cached = routeCache.get(key);
  if (cached) return cached;
  if (cableSegmentClear(start, end, allowedField)) {
    const path = [start, end];
    routeCache.set(key, path);
    return path;
  }
  const grid = gridFor(allowedField);
  const nearest = (point: Point2) => {
    const x = Math.round((point[0] - minX) / pitch),
      z = Math.round((point[1] - minZ) / pitch);
    for (let radius = 0; radius < 14; radius++) {
      const candidates: number[] = [];
      for (let dz = -radius; dz <= radius; dz++)
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const nx = x + dx,
            nz = z + dz,
            index = nz * width + nx;
          if (
            nx >= 0 &&
            nx < width &&
            nz >= 0 &&
            nz < height &&
            grid.free[index]
          )
            candidates.push(index);
        }
      candidates.sort(
        (a, b) =>
          Math.hypot(pointAt(a)[0] - point[0], pointAt(a)[1] - point[1]) -
          Math.hypot(pointAt(b)[0] - point[0], pointAt(b)[1] - point[1]),
      );
      const chosen = candidates.find((index) =>
        cableSegmentClear(point, pointAt(index), allowedField),
      );
      if (chosen !== undefined) return chosen;
    }
    throw new Error(
      `Cổng thiết bị nằm ngoài hành lang cáp hợp lệ: ${JSON.stringify({ point, allowedField, clear: cablePointClear(point, allowedField) })}`,
    );
  };
  const from = nearest(start),
    to = nearest(end),
    distance = new Float64Array(width * height).fill(Infinity),
    previous = new Int32Array(width * height).fill(-1),
    closed = new Uint8Array(width * height);
  const target = pointAt(to),
    heap = new Heap();
  distance[from] = 0;
  heap.push(from, 0);
  while (heap.values.length) {
    const { index } = heap.pop();
    if (closed[index]) continue;
    closed[index] = 1;
    if (index === to) break;
    const x = index % width,
      z = Math.floor(index / width);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = x + dx,
          nz = z + dz,
          next = nz * width + nx;
        if (
          nx < 0 ||
          nx >= width ||
          nz < 0 ||
          nz >= height ||
          !grid.free[next] ||
          closed[next]
        )
          continue;
        if (
          dx &&
          dz &&
          (!grid.free[z * width + nx] || !grid.free[nz * width + x])
        )
          continue;
        if (!cableSegmentClear(pointAt(index), pointAt(next), allowedField))
          continue;
        const weight =
          (Math.hypot(dx, dz) * pitch * (grid.cost[index] + grid.cost[next])) /
          2;
        const tentative = distance[index] + weight;
        if (tentative < distance[next]) {
          distance[next] = tentative;
          previous[next] = index;
          const p = pointAt(next);
          heap.push(
            next,
            tentative + Math.hypot(p[0] - target[0], p[1] - target[1]),
          );
        }
      }
  }
  if (!Number.isFinite(distance[to]))
    throw new Error("Không tìm được tuyến cáp không cắt vùng pin");
  const raw: Point2[] = [end];
  for (let at = to; at !== -1; at = previous[at]) raw.push(pointAt(at));
  raw.push(start);
  raw.reverse();
  const simplified: Point2[] = [raw[0]];
  for (let i = 0; i < raw.length - 1;) {
    let next = raw.length - 1;
    while (next > i + 1 && !cableSegmentClear(raw[i], raw[next], allowedField))
      next--;
    simplified.push(raw[next]);
    i = next;
  }
  for (let i = 1; i < simplified.length; i++)
    if (!cableSegmentClear(simplified[i - 1], simplified[i], allowedField))
      throw new Error(
        `Tuyến cáp đi qua vật cản: ${allowedField ?? "AC"} ${JSON.stringify([simplified[i - 1], simplified[i]])}`,
      );
  if (routeCache.size > 64) routeCache.clear();
  routeCache.set(key, simplified);
  return simplified;
}
export function closestCollector(
  parentId: string,
  inverterPort: Point2,
): Point2 {
  const field = hongLiemFields[Number(parentId.slice(-2)) - 1];
  let best = field.polygon[0],
    distance = Infinity;
  for (let i = 0; i < field.polygon.length; i++) {
    const a = field.polygon[i],
      b = field.polygon[(i + 1) % field.polygon.length],
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((inverterPort[0] - a[0]) * dx + (inverterPort[1] - a[1]) * dz) /
          (dx * dx + dz * dz || 1),
      ),
    );
    const p: Point2 = [a[0] + t * dx, a[1] + t * dz],
      d = Math.hypot(p[0] - inverterPort[0], p[1] - inverterPort[1]);
    if (d < distance) {
      distance = d;
      best = p;
    }
  }
  return best;
}
