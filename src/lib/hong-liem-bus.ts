import type { PowerLink, PowerPoint } from "./power-network";
import type { Asset } from "../data/plant";
import { collectorCircuits, type Point2 } from "../data/hong-liem-layout";
import { routeHongCable, cablePointClear } from "./hong-liem-cables";

export const southernInverters = ["INV-04", "INV-05"];
const length = (a: Point2, b: Point2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function clearPoint(point: Point2): Point2 {
  if (cablePointClear(point)) return point;
  for (let radius = 0.5; radius < 20; radius += 0.5)
    for (let i = 0; i < 48; i++) {
      const p: Point2 = [
        point[0] + Math.cos((i * Math.PI) / 24) * radius,
        point[1] + Math.sin((i * Math.PI) / 24) * radius,
      ];
      if (cablePointClear(p)) return p;
    }
  throw new Error("Không có hành lang tuyến thu gom phía Nam");
}
// One physical collector, split only at taps so each segment carries the sum
// of its upstream contributors. Virtual junctions are not extra power sources.
function collectCircuit(
  links: PowerLink[],
  assets: Asset[],
  circuit: (typeof collectorCircuits)[number],
): PowerLink[] {
  const branches = links.filter(
    (l) => l.kind === "AC" && circuit.inverters.includes(l.from),
  );
  if (!branches.length) return links;
  const station = assets.find((a) => a.id === branches[0].to)!;
  const end: Point2 = [station.position[0] - 2, station.position[2]];
  const guides = [...circuit.guides.map(clearPoint), end];
  const path: Point2[] = [guides[0]];
  for (let i = 1; i < guides.length; i++)
    path.push(...routeHongCable(path.at(-1)!, guides[i]).slice(1));
  const distance = [0];
  for (let i = 1; i < path.length; i++)
    distance.push(distance[i - 1] + length(path[i - 1], path[i]));
  const total = distance.at(-1)!;
  const at = (t: number): Point2 => {
    let i = 1;
    while (i < distance.length - 1 && distance[i] < t) i++;
    const ratio = (t - distance[i - 1]) / (distance[i] - distance[i - 1]);
    return [
      path[i - 1][0] + (path[i][0] - path[i - 1][0]) * ratio,
      path[i - 1][1] + (path[i][1] - path[i - 1][1]) * ratio,
    ];
  };
  const taps = branches
    .map((link) => {
      const start: Point2 = [link.points[0][0], link.points[0][2]];
      const target = circuit.tapOverrides[link.from] ?? start;
      let best = { t: 0, d: Infinity };
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1],
          b = path[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          len = length(a, b);
        if (len < 1e-8) continue;
        const ratio = Math.max(
          0,
          Math.min(
            1,
            ((target[0] - a[0]) * dx + (target[1] - a[1]) * dz) / (len * len),
          ),
        );
        const p: Point2 = [a[0] + dx * ratio, a[1] + dz * ratio],
          d = length(target, p);
        if (d < best.d) best = { t: distance[i - 1] + ratio * len, d };
      }
      return { link, start, t: best.t };
    })
    .sort((a, b) => a.t - b.t || a.link.from.localeCompare(b.link.from));
  // Coincident taps share a junction, without duplicate zero-length lines.
  const groups: { t: number; taps: typeof taps }[] = [];
  for (const tap of taps) {
    const last = groups.at(-1);
    if (last && Math.abs(last.t - tap.t) < 0.1) last.taps.push(tap);
    else groups.push({ t: tap.t, taps: [tap] });
  }
  const result = links.filter((l) => !branches.includes(l));
  const upstream: PowerLink[] = [];
  const point3 = (p: Point2): PowerPoint => [p[0], 0.24, p[1]];
  groups.forEach((group, index) => {
    const junction = `${circuit.prefix}-BUS-${String(index + 1).padStart(2, "0")}`,
      p = at(group.t);
    for (const tap of group.taps) {
      upstream.push(tap.link);
      result.push({
        ...tap.link,
        id: `${tap.link.from}->${junction}`,
        to: junction,
        role: "branch",
        points: routeHongCable(tap.start, p).map(point3),
      });
    }
    const stop = groups[index + 1]?.t ?? total;
    const slice = [
      p,
      ...path.filter(
        (_, i) => distance[i] > group.t + 1e-6 && distance[i] < stop - 1e-6,
      ),
      at(stop),
    ];
    const unknown = upstream.some((l) => l.powerMW === null);
    const powerMW = unknown
      ? null
      : upstream.reduce((sum, l) => sum + l.powerMW!, 0);
    const running = upstream.some((l) => l.running);
    result.push({
      id: `${circuit.prefix}-TRUNK-${index + 1}`,
      from: junction,
      to:
        index === groups.length - 1
          ? station.id
          : `${circuit.prefix}-BUS-${String(index + 2).padStart(2, "0")}`,
      kind: "AC",
      role: "trunk",
      contributors: upstream.map((l) => l.from),
      powerMW,
      running: !unknown && running,
      state: unknown
        ? "unknown"
        : upstream.every((l) => l.state === "stopped")
          ? "stopped"
          : upstream.some((l) => l.state !== "normal")
            ? "degraded"
            : "normal",
      points: slice.map(point3),
    });
  });
  return result;
}

export function collectSouthernAC(links: PowerLink[], assets: Asset[]) {
  return collectorCircuits.reduce(
    (result, circuit) => collectCircuit(result, assets, circuit),
    links,
  );
}
