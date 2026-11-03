import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { repairRoadCorner } from "../src/lib/road-geometry";

test("Góc đường GLB nhìn thấy mặt trên, không lộ đáy trùng địa hình", async () => {
  const buffer = readFileSync("public/sava-road-corner/road-corner.glb");
  const { scene } = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    "",
  );
  let source: Mesh | undefined;
  scene.traverse((node) => {
    if ((node as Mesh).isMesh) source = node as Mesh;
  });
  if (!source) throw new Error("Corner mesh missing");
  const original = Array.from(source.geometry.index!.array);
  const fixed = repairRoadCorner(source.geometry);
  const material = new MeshBasicMaterial();
  const ray = new Raycaster(new Vector3(0, 2, 0), new Vector3(0, -1, 0));
  const before = new Mesh(source.geometry, material),
    after = new Mesh(fixed, material);
  before.updateMatrixWorld();
  after.updateMatrixWorld();
  expect(ray.intersectObject(before)[0].point.y).toBeCloseTo(0);
  expect(ray.intersectObject(after)[0].point.y).toBeCloseTo(0.07);
  const positions = fixed.getAttribute("position"),
    index = fixed.index!;
  for (let i = 0; i < index.count; i += 3) {
    const [a, b, c] = [0, 1, 2].map((k) =>
      new Vector3().fromBufferAttribute(positions, index.getX(i + k)),
    );
    if ([a, b, c].every((v) => Math.abs(v.y - 0.07) < 1e-5))
      expect(b.clone().sub(a).cross(c.clone().sub(a)).y).toBeGreaterThan(0);
  }
  expect(Array.from(source.geometry.index!.array)).toEqual(original);
  fixed.dispose();
  material.dispose();
});
