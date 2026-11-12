import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  hongLiemFields,
  inverterPads,
  photoToGround,
  totalTableWeight,
} from "../src/data/hong-liem-layout";
import {
  getPlantProfile,
  branchRating,
  pvRating,
} from "../src/data/plant-profiles";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { buildPowerLinks } from "../src/lib/power-network";

test("Satellite field inventory, confirmed strips and photo-based inverter registry", async () => {
  const profile = getPlantProfile("hong-liem-3");
  console.log(
    "SATELLITE",
    JSON.stringify({
      counts: hongLiemFields.map((f) => f.rows.length),
      inverters: inverterPads.map((p) => ({ id: p.id, photo: p.photo })),
      weight: totalTableWeight,
    }),
  );
  await writeFile(
    "/tmp/hl-satellite-plan.json",
    JSON.stringify({
      fields: hongLiemFields.map((f) => ({
        name: f.name,
        polygon: f.photoPolygon,
        rows: f.rows.map((r) => r.photoBounds),
      })),
      pads: inverterPads,
    }),
  );
  expect(hongLiemFields).toHaveLength(13);
  expect(hongLiemFields[10].rows).toHaveLength(7);
  expect(hongLiemFields[11].rows).toHaveLength(6);
  expect(profile.assets.filter((a) => a.type === "inverter")).toHaveLength(5);
  expect(profile.assets).toHaveLength(21);
  expect(
    profile.assets
      .filter((a) => a.type === "inverter")
      .reduce((s, a) => s + branchRating(a.id, "hong-liem-3").dcMWp, 0),
  ).toBeCloseTo(50, 10);
  expect(
    profile.assets
      .filter((a) => a.type === "pv")
      .reduce((s, a) => s + pvRating(a.id, "hong-liem-3").acMW, 0),
  ).toBeCloseTo(40, 10);
  for (const pad of inverterPads) {
    const asset = profile.assets.find((a) => a.id === pad.id)!;
    const p = photoToGround(pad.photo);
    expect(asset.position.slice(0, 1)).toEqual([p[0]]);
    expect(asset.position[2]).toBe(p[1]);
    expect(asset.related.filter((id) => id.startsWith("PV-"))).toEqual(
      pad.pvIds,
    );
  }
});

test("Five real pad inputs conserve power through both collector circuits", () => {
  const run = createMonitoringSnapshot("hong-liem-3");
  const links = buildPowerLinks(run.assets, "hong-liem-3");
  console.log(
    "LINKS",
    links.map((l) => ({ id: l.id, p: l.powerMW })),
  );
  expect(
    links.filter((l) => l.kind === "AC" && l.role === "branch"),
  ).toHaveLength(5);
  const inputs = links.filter((l) => l.kind === "AC" && l.to === "TR-01");
  expect(inputs).toHaveLength(2);
  expect(inputs.reduce((s, l) => s + l.powerMW!, 0)).toBeCloseTo(
    run.powerMW!,
    10,
  );
  for (const link of links)
    expect(link.points.flat().every(Number.isFinite)).toBe(true);
});

test("[unit] All photographed inverter bodies fit their pads and every rack clears the reserved equipment space", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { Box3 } = await import("three");
  const buffer = await readFile("public/inverter/inverter.glb");
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    "",
  );
  const separated = (a: number[][], b: number[][]) =>
    [a, b].some((poly) =>
      poly.some((p, i) => {
        const q = poly[(i + 1) % poly.length],
          n = [q[1] - p[1], p[0] - q[0]];
        const aa = a.map((v) => v[0] * n[0] + v[1] * n[1]),
          bb = b.map((v) => v[0] * n[0] + v[1] * n[1]);
        return (
          Math.max(...aa) <= Math.min(...bb) + 1e-6 ||
          Math.max(...bb) <= Math.min(...aa) + 1e-6
        );
      }),
    );
  for (const pad of inverterPads) {
    const asset = getPlantProfile("hong-liem-3").assets.find(
      (a) => a.id === pad.id,
    )!;
    const model = gltf.scene.clone(true);
    model.scale.set(...asset.modelScale!);
    model.rotation.y = asset.modelRotation!;
    model.position.set(...asset.position);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model, true),
      [x0, y0, x1, y1] = pad.bounds,
      a = photoToGround([x0, y0]),
      b = photoToGround([x1, y1]);
    expect(box.min.x).toBeGreaterThanOrEqual(a[0] - 1e-6);
    expect(box.max.x).toBeLessThanOrEqual(b[0] + 1e-6);
    expect(box.min.z).toBeGreaterThanOrEqual(a[1] - 1e-6);
    expect(box.max.z).toBeLessThanOrEqual(b[1] + 1e-6);
    for (const field of hongLiemFields)
      for (const row of field.rows)
        expect(
          separated(row.photoBounds, [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
          ]),
        ).toBe(true);
  }
});

test("Photographed pads, Sava racks and route directions can be inspected in the shared dashboard", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/plants/hong-liem-3");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-pv-model", "sava-glb", {
    timeout: 60000,
  });
  const count = String(hongLiemFields.reduce((s, f) => s + f.rows.length, 0));
  await expect(canvas).toHaveAttribute("data-sava-p-v-tables", count);
  await expect(canvas).toHaveAttribute("data-stable-support-tables", count);
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-satellite-overview.png" });
  await page
    .locator(".kpis")
    .getByRole("button", { name: /Tổn thất năng lượng/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Nhánh 05 giảm 2%");
  await page.keyboard.press("Escape");
  for (const pad of inverterPads) {
    await page
      .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
      .click();
    const list = page.getByRole("dialog", {
      name: "Danh sách thiết bị",
      exact: true,
    });
    await list.getByRole("searchbox").fill(pad.id);
    await list.getByRole("button", { name: pad.id, exact: true }).click();
    await expect(canvas).toHaveAttribute("data-focus-target", pad.id);
    await expect(page.locator(".scene-hud")).toContainText("1 bệ = 1 inverter");
    await expect(page.locator('[data-power-terminal="DC"]')).toContainText(
      pad.id,
    );
    await expect(page.locator('[data-power-terminal="AC"]')).toContainText(
      "TR-01",
    );
    await page
      .locator(".scene-panel")
      .screenshot({ path: `test-results/hong-satellite-${pad.id}.png` });
  }
  expect(errors).toEqual([]);
});
