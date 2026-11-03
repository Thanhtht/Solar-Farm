import {
  Mesh,
  Object3D,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
} from "three";

type Point = [number, number];
const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

// Project actual model vertices onto the ground, rather than enclosing its diagonal in a circle.
export function footprintHull(object: Object3D): Point[] {
  object.updateMatrixWorld(true);
  const unique = new Map<string, Point>();
  const vertex = new Vector3();
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const positions = node.geometry.getAttribute("position");
    if (!positions) return;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
      unique.set(`${vertex.x.toFixed(5)},${vertex.z.toFixed(5)}`, [
        vertex.x,
        vertex.z,
      ]);
    }
  });
  const points = [...unique.values()].sort(
    (a, b) => a[0] - b[0] || a[1] - b[1],
  );
  const half = (list: Point[]) => {
    const result: Point[] = [];
    for (const p of list) {
      while (
        result.length >= 2 &&
        cross(result[result.length - 2], result[result.length - 1], p) <= 1e-8
      )
        result.pop();
      result.push(p);
    }
    return result.slice(0, -1);
  };
  const hull = [...half(points), ...half([...points].reverse())];
  if (hull.length < 3) throw new Error("Device model has no ground footprint");
  return hull;
}

function expand(hull: Point[], distance: number): Vector2[] {
  return hull.map((p, i) => {
    const prev = hull[(i + hull.length - 1) % hull.length],
      next = hull[(i + 1) % hull.length];
    const a = new Vector2(p[1] - prev[1], prev[0] - p[0]).normalize();
    const b = new Vector2(next[1] - p[1], p[0] - next[0]).normalize();
    const normal = a.clone().add(b);
    const scale = Math.min(
      distance / Math.max(1 + a.dot(b), 1e-8),
      (distance * 4) / normal.length(),
    );
    return new Vector2(...p).addScaledVector(normal, scale);
  });
}

export function createDeviceFootprint(object: Object3D) {
  const hull = footprintHull(object);
  const shape = new Shape(expand(hull, 0.28));
  shape.holes.push(new Path(expand(hull, 0.12)));
  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  geometry.computeBoundingBox();
  return geometry;
}
