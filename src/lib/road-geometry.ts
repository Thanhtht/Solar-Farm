import { BufferGeometry } from "three";

// Uploaded road corners have inward triangle winding: their bottom at Y=0
// becomes visible instead of the top at Y=.07, fighting with the terrain.
export function repairRoadCorner(source: BufferGeometry) {
  const geometry = source.clone();
  const indices = geometry.index
    ? Array.from(geometry.index.array)
    : Array.from(
        { length: geometry.getAttribute("position").count },
        (_, i) => i,
      );
  for (let i = 0; i < indices.length; i += 3)
    [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
