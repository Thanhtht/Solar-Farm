import {
  Box3,
  Matrix4,
  Object3D,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// The GLB frame extends slightly beyond its nominal 9 x 9.8 footprint.
// Fit the complete Sava model, not just its cells, before applying each
// site's existing table placement. Keep the original height and tilt.
export function fittedPvMatrix(model: Object3D): Matrix4 {
  const bounds = new Box3().setFromObject(model, true);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  return new Matrix4()
    .makeScale(9 / size.x, 1, 9.8 / size.z)
    .multiply(
      new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z),
    );
}

// Site tables are shallow strips. Compensate their non-uniform depth/height
// scale in the roof band so the modules retain Sava's pitch instead of
// becoming almost vertical. Warp every part together to retain rail joints.
export function fitPvRoof(
  geometry: import("three").BufferGeometry,
  ratio: number,
) {
  const positions = geometry.getAttribute("position");
  const knee = 0.7,
    centre = 0.94;
  const anchor = centre + (knee - centre) * ratio;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    positions.setY(
      i,
      y <= knee ? (y * anchor) / knee : centre + (y - centre) * ratio,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A satellite strip is one rack, while the Sava block contains six racks.
 * Reuse the first complete rack (all nine modules, frame and supports) rather
 * than squeezing six racks into one strip. No new table placements are made.
 */
export function createSavaPvRack(model: Object3D) {
  const rack = model.clone(true);
  rack.traverse((node) => {
    const mesh = node as import("three").Mesh;
    if (!mesh.isMesh) return;
    const source = mesh.geometry;
    const positions = source.getAttribute("position");
    const points: number[] = [];
    const count = source.index?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      const ids = [0, 1, 2].map((j) =>
        source.index ? source.index.getX(i + j) : i + j,
      );
      if (!ids.every((id) => positions.getZ(id) < -3.4)) continue;
      for (const id of ids)
        points.push(positions.getX(id), positions.getY(id), positions.getZ(id));
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    mesh.geometry = mergeVertices(geometry);
    geometry.dispose();
  });
  rack.updateMatrixWorld(true);
  return rack;
}
