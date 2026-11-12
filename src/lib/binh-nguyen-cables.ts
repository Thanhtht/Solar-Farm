import { roadTraces, fields } from "../data/binh-nguyen-layout";
import type { Point2 } from "../data/hong-liem-layout";
const key = (p: Point2) => `${p[0]},${p[1]}`;
const nodes = new Map<string, Point2>(),
  graph = new Map<string, { to: string; cost: number }[]>();
for (const road of roadTraces)
  for (let i = 0; i < road.length; i++) {
    const id = key(road[i]);
    nodes.set(id, road[i]);
    if (!graph.has(id)) graph.set(id, []);
    if (i) {
      const previous = key(road[i - 1]),
        cost = Math.hypot(
          road[i][0] - road[i - 1][0],
          road[i][1] - road[i - 1][1],
        );
      graph.get(id)!.push({ to: previous, cost });
      graph.get(previous)!.push({ to: id, cost });
    }
  }
export function routeBinhRoad(start: Point2, end: Point2): Point2[] {
  const nearest = (p: Point2) =>
    [...nodes.entries()].sort(
      (a, b) =>
        Math.hypot(a[1][0] - p[0], a[1][1] - p[1]) -
        Math.hypot(b[1][0] - p[0], b[1][1] - p[1]),
    )[0][0];
  const from = nearest(start),
    target = nearest(end),
    dist = new Map<string, number>([[from, 0]]),
    previous = new Map<string, string>(),
    open = new Set(nodes.keys());
  while (open.size) {
    let current = [...open].sort(
      (a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity),
    )[0];
    if (!Number.isFinite(dist.get(current))) break;
    open.delete(current);
    if (current === target) break;
    for (const edge of graph.get(current)!) {
      const candidate = dist.get(current)! + edge.cost;
      if (candidate < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, candidate);
        previous.set(edge.to, current);
      }
    }
  }
  if (!dist.has(target))
    throw new Error("Tuyến thu gom Bình Nguyên bị đứt kết nối");
  const path: Point2[] = [];
  for (let at: string | undefined = target; at; at = previous.get(at))
    path.push(nodes.get(at)!);
  const result = [start, ...path.reverse(), end];
  return result.filter(
    (p, i) =>
      i === 0 ||
      Math.hypot(p[0] - result[i - 1][0], p[1] - result[i - 1][1]) > 1e-6,
  );
}
export function binhCollector(id: string, end: Point2): Point2 {
  const polygon = fields[Number(id.slice(-2)) - 1].polygon;
  let best = polygon[0],
    distance = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      t = Math.max(
        0,
        Math.min(
          1,
          ((end[0] - a[0]) * dx + (end[1] - a[1]) * dz) / (dx * dx + dz * dz),
        ),
      );
    const p: Point2 = [a[0] + dx * t, a[1] + dz * t],
      d = Math.hypot(p[0] - end[0], p[1] - end[1]);
    if (d < distance) {
      best = p;
      distance = d;
    }
  }
  return best;
}
