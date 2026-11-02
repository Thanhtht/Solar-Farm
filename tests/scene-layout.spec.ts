import { test, expect } from "@playwright/test";
import { assets, attentionAssets, snapshot } from "../src/data/plant";
import {
  allModelUrls,
  deviceModels,
  landscapeModels,
  landscapePlacements,
} from "../src/data/scene-layout";
import { readFileSync, existsSync } from "node:fs";
import { Box3, Matrix4, Object3D, Vector3 } from "three";
// Bounds are measured from the uploaded files, not duplicated estimates of primitive geometry.
const report = JSON.parse(readFileSync("docs/3D_ASSET_AUDIT.json", "utf8"));
function boundsFor(url: string) {
  const model = report.assets.find(
    (m: { file: string }) => m.file === `public${url}`,
  );
  if (!model) throw Error(url);
  return new Box3(new Vector3(...model.min), new Vector3(...model.max));
}
test("GLB tồn tại; đường và nhà không chồng vị trí thiết bị", () => {
  expect(new Set(allModelUrls).size).toBe(16);
  for (const url of allModelUrls)
    expect(existsSync(`public${url}`), url).toBe(true);
  for (const asset of assets) {
    expect(asset.position[1]).toBe(0);
    const device = boundsFor(deviceModels[asset.type]).translate(
      new Vector3(...asset.position),
    );
    // A small vertical range around the road surface detects real footprint collisions.
    for (const kind of ["road", "corner", "building"] as const)
      for (const placement of landscapePlacements[kind]) {
        const transform = new Object3D();
        transform.position.set(...placement.position);
        transform.rotation.y = placement.rotation ?? 0;
        transform.scale.set(...(placement.scale ?? [1, 1, 1]));
        transform.updateMatrix();
        const obstacle = boundsFor(landscapeModels[kind]).applyMatrix4(
          new Matrix4().copy(transform.matrix),
        );
        expect(
          device.intersectsBox(obstacle),
          `${asset.id} intersects ${kind} at ${placement.position}`,
        ).toBe(false);
      }
  }
});

test("Hai cảnh báo nhiệt độ có số đo đúng và không giả mất khả dụng", () => {
  expect(
    attentionAssets.filter((a) => a.attention?.level === "critical"),
  ).toHaveLength(1);
  expect(
    attentionAssets.filter((a) => a.attention?.level === "warning"),
  ).toHaveLength(1);
  for (const asset of attentionAssets) {
    expect(asset.connection).toBe("Đang kết nối");
    const temperature = asset.signals.find(
      (s) => s.id === asset.attention!.signalId,
    )!;
    expect(temperature.value).toBeGreaterThanOrEqual(
      asset.type === "inverter" ? 70 : 55,
    );
    expect(
      asset.signals.find((s) => s.id.endsWith(".pac") || s.id.endsWith(".pdc"))!
        .value,
    ).toBeGreaterThan(0);
  }
  expect(snapshot.availability).toBe(100);
});
