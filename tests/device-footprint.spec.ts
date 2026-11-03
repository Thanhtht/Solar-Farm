import { test, expect } from "@playwright/test";
import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from "three";
import {
  createDeviceFootprint,
  footprintHull,
} from "../src/lib/device-footprint";

test("Viền ô pin sát mặt bằng và rỗng ở giữa, không thành đĩa màu", () => {
  const box = new BoxGeometry(12, 1, 8),
    material = new MeshBasicMaterial({ side: DoubleSide });
  const outline = createDeviceFootprint(new Mesh(box));
  const mesh = new Mesh(outline, material);
  mesh.updateMatrixWorld(true);
  expect(outline.boundingBox!.min.x).toBeCloseTo(-6.28);
  expect(outline.boundingBox!.max.z).toBeCloseTo(4.28);
  const ray = new Raycaster(new Vector3(0, 10, 0), new Vector3(0, -1, 0));
  expect(ray.intersectObject(mesh)).toHaveLength(0);
  ray.set(new Vector3(6.2, 10, 0), new Vector3(0, -1, 0));
  expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
  outline.dispose();
  box.dispose();
  material.dispose();
});

test("Viền theo hình chiếu model xoay, không lấy hộp lớn theo trục thế giới", () => {
  const box = new BoxGeometry(12, 1, 8),
    model = new Mesh(box);
  model.rotation.y = Math.PI / 4;
  const hull = footprintHull(model);
  const area =
    Math.abs(
      hull.reduce((sum, p, i) => {
        const q = hull[(i + 1) % hull.length];
        return sum + p[0] * q[1] - p[1] * q[0];
      }, 0),
    ) / 2;
  expect(area).toBeCloseTo(96);
  expect(hull).toHaveLength(4);
  expect(Math.max(...hull.map((p) => p[0]))).toBeCloseTo(10 / Math.sqrt(2));
  box.dispose();
});
