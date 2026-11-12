import {
  DataTexture,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  LinearMipmapLinearFilter,
  LinearFilter,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from "three";

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

/** Bake the GLB's module coverage into a filtered alpha atlas. Mipmaps average
 * module edges and gaps before rasterization, unlike sub-pixel triangle edges.
 */
export function createPvFilteredSurface(source: BufferGeometry) {
  const tops = createPvTopSurface(source),
    positions = tops.getAttribute("position");
  const size = 512,
    pixels = new Uint8Array(size * size * 4);
  // White RGB even in transparent texels avoids dark halos after minification.
  for (let i = 0; i < pixels.length; i += 4) pixels.fill(255, i, i + 3);
  for (let i = 0; i < positions.count; i += 3) {
    const p = [0, 1, 2].map((j) => [
      ((positions.getX(i + j) + 4.5) / 9) * size,
      ((4.9 - positions.getZ(i + j)) / 9.8) * size,
    ]);
    const minX = Math.max(0, Math.floor(Math.min(...p.map((v) => v[0])))),
      maxX = Math.min(size - 1, Math.ceil(Math.max(...p.map((v) => v[0]))));
    const minY = Math.max(0, Math.floor(Math.min(...p.map((v) => v[1])))),
      maxY = Math.min(size - 1, Math.ceil(Math.max(...p.map((v) => v[1]))));
    const edge = (a: number[], b: number[], x: number, y: number) =>
      (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0]);
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const e = [
          edge(p[0], p[1], x + 0.5, y + 0.5),
          edge(p[1], p[2], x + 0.5, y + 0.5),
          edge(p[2], p[0], x + 0.5, y + 0.5),
        ];
        if (e.every((v) => v >= 0) || e.every((v) => v <= 0)) {
          const offset = (y * size + x) * 4;
          pixels.fill(255, offset, offset + 4);
        }
      }
  }
  tops.dispose();
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  const geometry = new PlaneGeometry(9, 9.8);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 1.1, 0);
  return { geometry, texture };
}
