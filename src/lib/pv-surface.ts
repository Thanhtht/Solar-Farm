import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

/** Use face normals for hard-edged metal instead of interpolating box corners. */
export function createFlatGeometry(source: BufferGeometry): BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  geometry.computeVertexNormals();
  return geometry;
}

/** Original GLB module tops, shared by far and close views; no horizontal proxy.
 * Omit hidden box undersides/edges, which alias at plant scale. Double-sided
 * material keeps the same panel visible from underneath without overlapping faces.
 */
export function createPvTopSurface(source: BufferGeometry): BufferGeometry {
  const flat = createFlatGeometry(source);
  const position = flat.getAttribute("position");
  const points: number[] = [];
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3();
  const edge = new Vector3(),
    normal = new Vector3();
  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    normal.subVectors(b, a).cross(edge.subVectors(c, a)).normalize();
    if (normal.y < 0.8) continue;
    points.push(...a.toArray(), ...b.toArray(), ...c.toArray());
  }
  flat.dispose();
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
