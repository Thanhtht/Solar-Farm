import { BoxGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
// Shared table silhouette: six posts and four rails, 120 triangles per table.
// Built once per batch, then instanced at every distance, without LOD swapping.
export function createStablePvSupports() {
  const parts: BoxGeometry[] = [];
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const g = new BoxGeometry(w, h, d);
    g.translate(x, y, z);
    parts.push(g);
  };
  for (const x of [-3.8, 3.8])
    for (const z of [-4, 0, 4]) box(0.17, 1.155, 0.1, x, 0.5025, z);
  for (const x of [-3.8, 3.8]) box(0.17, 0.1, 9.3, x, 1.04, 0);
  for (const z of [-4.45, 4.45]) box(8.3, 0.1, 0.12, 0, 1.04, z);
  const geometry = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  geometry.computeBoundingBox();
  return geometry;
}
