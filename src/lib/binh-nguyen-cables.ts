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
  const edges = roadTraces.flatMap((road) =>
    road.slice(1).map((b, i) => [road[i], b] as [Point2, Point2]),
  );
  const nearest = (p: Point2) => {
    let best = { edge: 0, point: edges[0][0], distance: Infinity };
    edges.forEach(([a, b], edge) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(
            1,
            ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz),
          ),
        );
      const point: Point2 = [a[0] + dx * t, a[1] + dz * t],
        distance = Math.hypot(point[0] - p[0], point[1] - p[1]);
      if (distance < best.distance) best = { edge, point, distance };
    });
    return best;
  };
  const localNodes = new Map(nodes),
    localGraph = new Map([...graph].map(([k, v]) => [k, [...v]]));
  const connect = (a: Point2, b: Point2) => {
    const ka = key(a),
      kb = key(b),
      cost = Math.hypot(a[0] - b[0], a[1] - b[1]);
    localNodes.set(ka, a);
    localNodes.set(kb, b);
    if (!localGraph.has(ka)) localGraph.set(ka, []);
    if (!localGraph.has(kb)) localGraph.set(kb, []);
    if (cost > 1e-8) {
      localGraph.get(ka)!.push({ to: kb, cost });
      localGraph.get(kb)!.push({ to: ka, cost });
    }
  };
  const first = nearest(start),
    last = nearest(end);
  for (const entry of [first, last]) {
    connect(entry.point, edges[entry.edge][0]);
    connect(entry.point, edges[entry.edge][1]);
  }
  if (first.edge === last.edge) connect(first.point, last.point);
  const from = key(first.point),
    target = key(last.point),
    dist = new Map<string, number>([[from, 0]]),
    previous = new Map<string, string>(),
    open = new Set(localNodes.keys());
  while (open.size) {
    let current = [...open].sort(
      (a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity),
    )[0];
    if (!Number.isFinite(dist.get(current))) break;
    open.delete(current);
    if (current === target) break;
    for (const edge of localGraph.get(current)!) {
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
    path.push(localNodes.get(at)!);
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
