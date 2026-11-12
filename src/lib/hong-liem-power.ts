import {
  inverterPads,
  photoToGround,
  hongLiemFields,
  pvRowRotation,
} from "../data/hong-liem-layout";
import type { Point2 } from "../data/hong-liem-layout";
import type { Asset } from "../data/plant";
import type { PowerLink, PowerPoint } from "./power-network";
import {
  closestCollector,
  routeHongCable,
  cableSegmentClear,
} from "./hong-liem-cables";
export function hongTerminals(inv: Asset) {
  const pad = inverterPads.find((p) => p.id === inv.id)!;
  const access = photoToGround(pad.access),
    p: Point2 = [inv.position[0], inv.position[2]];
  const rotation = inv.modelRotation ?? 0,
    axis: Point2 = [Math.cos(rotation), -Math.sin(rotation)];
  const side =
    Math.sign((access[0] - p[0]) * axis[0] + (access[1] - p[1]) * axis[1]) || 1;
  const point = (length: number): Point2 => [
    p[0] + axis[0] * side * length,
    p[1] + axis[1] * side * length,
  ];
  return {
    pad,
    access,
    side,
    dc: point(-0.88),
    ac: point(0.88),
    back: point(-1.15),
  };
}
export function routeHongPower(
  link: PowerLink,
  from: Asset,
  to: Asset,
): PowerPoint[] {
  const t = hongTerminals(link.kind === "DC" ? to : from);
  let path: Point2[];
  if (link.kind === "AC")
    path = routeHongCable(t.ac, [to.position[0] - 2, to.position[2]]);
  else {
    const field =
      hongLiemFields[Number((from.parentId ?? from.id).slice(-2)) - 1];
    const c = Math.cos(pvRowRotation),
      s = Math.sin(pvRowRotation);
    let source: Point2 = field.center,
      distance = Infinity;
    for (const row of field.rows) {
      const x = t.back[0] - row.position[0],
        z = t.back[1] - row.position[2];
      const u = Math.max(
        -4.5 * row.scale![0],
        Math.min(4.5 * row.scale![0], x * c - z * s),
      );
      const v = Math.max(
        -4.9 * row.scale![2],
        Math.min(4.9 * row.scale![2], x * s + z * c),
      );
      const p: Point2 = [
        row.position[0] + u * c + v * s,
        row.position[2] - u * s + v * c,
      ];
      const d = Math.hypot(p[0] - t.back[0], p[1] - t.back[1]);
      if (d < distance) {
        distance = d;
        source = p;
      }
    }
    if (
      distance < 4 &&
      cableSegmentClear(source, t.back, from.parentId ?? from.id)
    )
      path = [source, t.back, t.dc];
    else {
      source = closestCollector(from.parentId ?? from.id, t.back);
      path = [
        ...routeHongCable(source, t.back, from.parentId ?? from.id),
        t.dc,
      ];
    }
    if (from.parentId) path.unshift([from.position[0], from.position[2]]);
  }
  return path
    .filter(
      (p, i) =>
        !i || Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) > 1e-6,
    )
    .map(([x, z]) => [x, 0.24, z]);
}
