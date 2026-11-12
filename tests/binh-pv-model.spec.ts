import {
  fittedPvMatrix,
  fitPvRoof,
  createSavaPvRack,
} from "../src/lib/pv-model";
import { test, expect } from "@playwright/test";
import { fields, photoToGround } from "../src/data/binh-nguyen-layout";
import { readFile } from "node:fs/promises";

test("Original Sava PV geometry fits every existing variable-length Binh footprint", async () => {
  const { Box3, Mesh, Object3D } = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const buffer = await readFile("public/pv-block/pv-block.glb");
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    "",
  );
  const rack = createSavaPvRack(gltf.scene);
  const rows = fields.flatMap((f) => f.rows);
  expect(rows).toHaveLength(2504);
  const names: string[] = [];
  rack.traverse((n) => {
    if (n instanceof Mesh) names.push(n.name);
  });
  expect(names.sort()).toEqual(["PV_CELLS", "PV_FRAME", "PV_SUPPORTS"]);
  const cells = rack.getObjectByName("PV_CELLS") as import("three").Mesh;
  expect(
    (cells.geometry.index?.count ??
      cells.geometry.getAttribute("position").count) / 3,
  ).toBe(108);
  const cellBounds = new Box3().setFromObject(cells);
  expect(cellBounds.max.y - cellBounds.min.y).toBeGreaterThan(0.1);
  rack.traverse((n) => {
    if (n instanceof Mesh)
      n.geometry = fitPvRoof(
        n.geometry.clone(),
        (rows[0].scale![2] / rows[0].scale![1]) *
          fittedPvMatrix(rack).elements[10],
      );
  });
  const object = new Object3D();
  const fitted = new Object3D();
  fitted.matrixAutoUpdate = false;
  fitted.matrix.copy(fittedPvMatrix(rack));
  fitted.add(rack);
  object.add(fitted);
  for (const row of rows) {
    object.position.set(...row.position);
    object.scale.set(...row.scale!);
    object.rotation.y = row.rotation!;
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object, true);
    const [x0, y0, x1, y1] = row.photoBounds;
    const a = photoToGround([x0, y0]),
      b = photoToGround([x1, y1]);
    expect(box.min.x).toBeGreaterThanOrEqual(a[0] - 1e-6);
    expect(box.max.x).toBeLessThanOrEqual(b[0] + 1e-6);
    expect(box.min.z).toBeGreaterThanOrEqual(a[1] - 1e-6);
    expect(box.max.z).toBeLessThanOrEqual(b[1] + 1e-6);
    expect(box.min.y).toBeGreaterThanOrEqual(0.069);
    expect(box.max.y - box.min.y).toBeGreaterThan(0.35);
  }
});

test("Binh uses real Sava cells, frames and supports at close, low and distant views", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/plants/binh-nguyen");
  const canvas = page.locator("#plant-view canvas");
  const check = async () => {
    await expect(canvas).toHaveAttribute("data-pv-model", "sava-glb", {
      timeout: 60000,
    });
    await expect(canvas).toHaveAttribute("data-sava-p-v-tables", "2504");
    await expect(canvas).toHaveAttribute("data-stable-support-tables", "2504");
  };
  await check();
  for (const id of ["PV-08-001", "PV-09-050"]) {
    await page
      .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
      .click();
    const list = page.getByRole("dialog", {
      name: "Danh sách thiết bị",
      exact: true,
    });
    await list
      .getByRole("combobox", { name: "Cấp chi tiết thiết bị" })
      .selectOption("assets");
    await list.getByRole("searchbox").fill(id);
    await list.getByRole("button", { name: id, exact: true }).click();
    await expect(canvas).toHaveAttribute("data-focus-target", id);
    await check();
    expect(
      Number(await canvas.getAttribute("data-sava-p-v-frames")),
    ).toBeGreaterThan(0);
    await page
      .locator(".scene-panel")
      .screenshot({ path: `test-results/binh-sava-close-${id}.png` });
  }
  await canvas.scrollIntoViewIfNeeded();
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.55);
  await page.mouse.wheel(0, -400);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.53, b.y + b.height * 0.3, {
    steps: 4,
  });
  await page.mouse.up();
  await check();
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/binh-sava-low-angle.png" });
  await page.mouse.wheel(0, 450);
  await check();
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/binh-sava-low-angle-zoom-out.png" });
  expect(errors).toEqual([]);
});
