import { test, expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3, Mesh, Matrix4 } from "three";
import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  createPvTopSurface,
  createPvFilteredSurface,
} from "../src/lib/pv-surface";
import {
  hongLiemBlocks,
  blocksInField,
  getHongLiemBlock,
} from "../src/data/hong-liem-blocks";
import {
  hongLiemFields,
  polygonArea,
  pvRowScale,
  hongLiemBoundary,
  insidePolygon,
  vegetationIsland,
} from "../src/data/hong-liem-layout";
import { resolvePlantAsset, isPlantAssetId } from "../src/lib/plant-assets";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { createSession, presetConfig } from "../src/lib/scenario-simulation";
import {
  initialSimulationConfig,
  referencedAssets,
} from "../src/lib/assistant-actions";
import { buildAnalysis, parseSelection, contextKey } from "../src/lib/analysis";
import {
  createPerformanceHistory,
  historyRange,
} from "../src/lib/performance-history";
import { southernInverters } from "../src/lib/hong-liem-bus";
import { buildPowerLinks } from "../src/lib/power-network";
import { cableSegmentClear } from "../src/lib/hong-liem-cables";

test("[unit] PV module faces retain their original tilt and solid coverage when switching detail", async () => {
  const buffer = await readFile("public/pv-block/pv-block.glb");
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    "",
  );
  const source = (gltf.scene.getObjectByName("PV_CELLS") as Mesh).geometry;
  const geometry = createPvTopSurface(source);
  // 54 original module faces, each two triangles. Box undersides/edges are gone.
  expect(geometry.getAttribute("position").count).toBe(54 * 6);
  const positions = geometry.getAttribute("position"),
    normals = geometry.getAttribute("normal");
  const transform = new Matrix4().makeScale(...pvRowScale);
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    normal = new Vector3();
  for (let i = 0; i < positions.count; i += 3) {
    a.fromBufferAttribute(positions, i);
    b.fromBufferAttribute(positions, i + 1);
    c.fromBufferAttribute(positions, i + 2);
    const face = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    for (let j = 0; j < 3; j++)
      expect(
        normal.fromBufferAttribute(normals, i + j).dot(face),
      ).toBeGreaterThan(0.9999);
    a.applyMatrix4(transform);
    b.applyMatrix4(transform);
    c.applyMatrix4(transform);
    normal.subVectors(b, a).cross(c.sub(a)).normalize();
    expect((Math.acos(normal.y) * 180) / Math.PI).toBeCloseTo(12, 3);
  }
  const filtered = createPvFilteredSurface(source);
  expect(filtered.texture.generateMipmaps).toBe(true);
  expect(filtered.geometry.getAttribute("position").count).toBe(4);
  const pixels = filtered.texture.image.data!;
  let opaque = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) opaque++;
  expect(opaque / (512 * 512)).toBeGreaterThan(0.65);
  expect(opaque / (512 * 512)).toBeLessThan(0.85);
  filtered.texture.dispose();
  filtered.geometry.dispose();
  geometry.dispose();
});

const config = { ...initialSimulationConfig, plantId: "hong-liem-3" as const };
test("[unit] Small blocks preserve identity, parent totals, quality, scenarios and historical provenance", () => {
  const run = createMonitoringSnapshot("hong-liem-3"),
    before = structuredClone(run);
  expect(blocksInField("PV-11")).toHaveLength(7);
  expect(blocksInField("PV-12")).toHaveLength(6);
  const referenceArea =
    polygonArea(hongLiemFields[10].polygon) +
    polygonArea(hongLiemFields[11].polygon);
  for (const field of hongLiemFields.slice(0, 10)) {
    expect(field.rows).toHaveLength(
      Math.round((polygonArea(field.polygon) * 13) / referenceArea),
    );
    expect(field.countBasis).toBe("area-estimate");
  }
  expect(hongLiemFields[10].countBasis).toBe("user-confirmed");
  expect(pvRowScale[2] * 9.8).toBeGreaterThan(pvRowScale[0] * 9 * 3);
  expect(new Set(hongLiemBlocks.map((b) => b.id)).size).toBe(
    hongLiemBlocks.length,
  );
  for (const parent of run.assets.filter((a) => a.type === "pv")) {
    const children = blocksInField(parent.id).map((b) =>
      resolvePlantAsset(run.assets, b.id, "hong-liem-3")!,
    );
    const pdc = children.reduce(
      (sum, a) =>
        sum + a.signals.find((s) => s.id.endsWith(".pdc"))!.value! / 1000,
      0,
    );
    expect(pdc).toBeCloseTo(
      parent.signals.find((s) => s.id.endsWith(".pdc"))!.value!,
      10,
    );
  }
  const child = resolvePlantAsset(run.assets, "PV-02-015", "hong-liem-3")!;
  expect(child.parentId).toBe("PV-02");
  expect(child.layoutNote).toContain("Ước lượng");
  expect(
    resolvePlantAsset(run.assets, "PV-11", "hong-liem-3")!.layoutNote,
  ).toContain("7 cụm nhỏ");
  expect(
    resolvePlantAsset(run.assets, "PV-11-007", "hong-liem-3"),
  ).toBeDefined();
  expect(isPlantAssetId("PV-11-008", "hong-liem-3")).toBe(false);
  expect(child.dataScope).toContain("Không có số đo riêng");
  expect(child.related).toEqual(["PV-02", "INV-02", "GW-01"]);
  expect(child.signals.find((s) => s.id.endsWith(".pdc"))!.unit).toBe("kW");
  expect(isPlantAssetId(child.id, "sava")).toBe(false);
  expect(isPlantAssetId("PV-02-9999", "hong-liem-3")).toBe(false);
  expect(referencedAssets(`Phân tích ${child.id}`, "hong-liem-3")[0]).toBe(
    child.id,
  );
  const selection = {
    plantId: "hong-liem-3" as const,
    mode: "current" as const,
    assetId: child.id,
    revision: 1,
    submitted: false,
    config,
  };
  const parsed = parseSelection(selection);
  expect(buildAnalysis(parsed).selected?.id).toBe(child.id);
  expect(buildAnalysis(parsed).selected?.dataScope).toContain("PV-02");
  const scenario = createSession(
    { ...presetConfig("fault", config), target: "INV-02", scale: 1 },
    1,
    run,
  ).untreated;
  const failed = resolvePlantAsset(scenario.assets, child.id, "hong-liem-3")!;
  expect(failed.operatingState).toBe("stopped");
  expect(failed.connection).toBe("Đang kết nối");
  expect(failed.signals.find((s) => s.id.endsWith(".pdc"))!.value).toBe(0);
  const missing = structuredClone(run.assets);
  const signal = missing
    .find((a) => a.id === "PV-02")!
    .signals.find((s) => s.id.endsWith(".pdc"))!;
  signal.value = null;
  signal.quality = "missing";
  expect(
    resolvePlantAsset(missing, child.id, "hong-liem-3")!.signals.find((s) =>
      s.id.endsWith(".pdc"),
    )!.value,
  ).toBeNull();
  const history = createPerformanceHistory({
    now: new Date("2026-11-11T05:00:00Z"),
    plantId: "hong-liem-3",
  });
  const parent = historyRange(history, history.window, "PV-02"),
    small = historyRange(history, history.window, child.id),
    count = blocksInField("PV-02").length;
  expect(small.summary.actualEnergyMWh! * count).toBeCloseTo(
    parent.summary.actualEnergyMWh!,
    8,
  );
  expect(small.summary.coveragePct).toBe(parent.summary.coveragePct);
  expect(small.byAsset[0].assetId).toBe(child.id);
  expect(small.dataScope).toContain("không có số đo riêng");
  expect(run).toEqual(before);
  expect(run.assets).toHaveLength(27);
});

test("[unit] Cable routes connect correct ports and avoid other PV fields, the vegetation island and the control building", () => {
  test.setTimeout(120000);
  const run = createMonitoringSnapshot("hong-liem-3"),
    links = buildPowerLinks(run.assets, "hong-liem-3");
  expect(
    links
      .filter((l) => l.role === "branch")
      .map((l) => l.from)
      .sort(),
  ).toEqual([...southernInverters].sort());
  expect(links.filter((l) => l.kind === "AC" && !l.role)).toHaveLength(5);
  const trunks = links.filter((l) => l.role === "trunk");
  expect(trunks.length).toBeGreaterThan(0);
  for (const trunk of trunks) {
    const incoming = links.filter((l) => l.to === trunk.from);
    expect(trunk.powerMW).toBeCloseTo(
      incoming.reduce((s, l) => s + l.powerMW!, 0),
      10,
    );
    expect(
      incoming.every((l) =>
        l.points
          .at(-1)!
          .every((v, i) => Math.abs(v - trunk.points[0][i]) < 1e-6),
      ),
    ).toBe(true);
  }
  expect(trunks.filter((l) => l.to === "TR-01")).toHaveLength(1);
  expect(
    links
      .filter((l) => l.kind === "AC" && l.to === "TR-01")
      .reduce((s, l) => s + l.powerMW!, 0),
  ).toBeCloseTo(run.powerMW!, 10);
  for (const link of links) {
    const destination = run.assets.find((a) => a.id === link.to)!;
    const end = link.points.at(-1)!;
    if (destination) {
      expect(end[0]).toBeCloseTo(
        destination.position[0] - (link.kind === "AC" ? 2 : 0),
      );
      expect(end[2]).toBeCloseTo(
        destination.position[2] - (link.kind === "DC" ? 0.55 : 0),
      );
    }
    for (let i = 1; i < link.points.length; i++) {
      const a = link.points[i - 1],
        b = link.points[i];
      expect(
        cableSegmentClear(
          [a[0], a[2]],
          [b[0], b[2]],
          link.kind === "DC" ? link.from : undefined,
        ),
        link.id,
      ).toBe(true);
    }
  }
  const child = resolvePlantAsset(run.assets, "PV-02-015", "hong-liem-3")!;
  const detail = buildPowerLinks([...run.assets, child], "hong-liem-3");
  const cable = detail.find((l) => l.from === child.id)!;
  expect(cable.to).toBe("INV-02");
  expect(cable.powerMW).toBeCloseTo(
    child.signals.find((s) => s.id.endsWith(".pdc"))!.value! / 1000,
  );
  expect(
    detail
      .filter((l) => l.kind === "AC" && l.to === "TR-01")
      .reduce((s, l) => s + l.powerMW!, 0),
  ).toBeCloseTo(run.powerMW!, 10);
  expect(detail.find((l) => l.from === "INV-03")!.running).toBe(false);
  expect(detail.find((l) => l.from === "INV-03")!.state).toBe("stopped");
  const unknown = structuredClone(run.assets);
  unknown
    .find((a) => a.id === "INV-01")!
    .signals.find((s) => s.id.endsWith(".pac"))!.value = null;
  const unknownTrunk = buildPowerLinks(unknown, "hong-liem-3").find(
    (l) => l.role === "trunk" && l.to === "TR-01",
  )!;
  expect(unknownTrunk).toMatchObject({
    powerMW: null,
    running: false,
    state: "unknown",
  });
  const dark = structuredClone(run.assets);
  for (const a of dark) {
    delete a.attention;
    delete a.monitoringIssue;
    delete a.operatingState;
    delete a.scenario;
    a.operation = "Bình thường";
    for (const signal of a.signals)
      if (signal.id.endsWith(".pac") || signal.id.endsWith(".fault"))
        signal.value = 0;
  }
  const darkTrunks = buildPowerLinks(dark, "hong-liem-3").filter(
    (l) => l.role === "trunk",
  );
  expect(
    darkTrunks.every(
      (l) => l.state === "normal" && !l.running && l.powerMW === 0,
    ),
  ).toBe(true);
  const sava = buildPowerLinks(createMonitoringSnapshot().assets);
  expect(sava).toHaveLength(16);
});

async function project(
  page: Page,
  canvas: import("@playwright/test").Locator,
  point: [number, number, number],
) {
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const values = await canvas.evaluate((element) => ({
    position: JSON.parse(element.dataset.cameraPosition!),
    target: JSON.parse(element.dataset.cameraTarget!),
    fov: Number(element.dataset.cameraFov),
  }));
  const camera = new PerspectiveCamera(
    values.fov,
    box.width / box.height,
    0.8,
    1800,
  );
  camera.position.set(...(values.position as [number, number, number]));
  camera.lookAt(...(values.target as [number, number, number]));
  camera.updateMatrixWorld();
  const p = new Vector3(...point).project(camera);
  return {
    x: box.x + ((p.x + 1) / 2) * box.width,
    y: box.y + ((1 - p.y) / 2) * box.height,
  };
}

test("Picking one small block zooms to that block, opens its profile and uses matte materials at multiple camera angles", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/hong-liem-3");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-plant-id", "hong-liem-3", {
    timeout: 60000,
  });
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-pv-roughness")))
    .toBeGreaterThanOrEqual(0.99);
  await expect(canvas).toHaveAttribute("data-pv-metalness", "0");
  await expect(canvas).toHaveAttribute("data-pv-specular", "0");
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha");
  await expect(canvas).toHaveAttribute("data-pv-material", "MeshBasicMaterial");
  await page.screenshot({
    path: "test-results/hong-liem-matte-overview.png",
    fullPage: true,
  });
  const block = getHongLiemBlock("PV-02-015")!,
    before = await page.locator(".kpis").textContent();
  const position: [number, number, number] = [
    block.placement.position[0] +
      Math.sin(block.placement.rotation!) * -0.85 * pvRowScale[2],
    block.placement.position[1] + 0.94 * pvRowScale[1],
    block.placement.position[2] +
      Math.cos(block.placement.rotation!) * -0.85 * pvRowScale[2],
  ];
  const p = await project(page, canvas, position);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator(".scene-hud")).toContainText(block.id, {
    timeout: 15000,
  });
  await expect(canvas).toHaveAttribute("data-focus-target", block.id, {
    timeout: 15000,
  });
  await expect(page.locator(".scene-hud")).toContainText(
    "Không có số đo riêng",
  );
  await expect(page.locator(".kpis")).toHaveText(before!);
  const camera = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  expect(
    new Vector3(...camera).distanceTo(new Vector3(...position)),
  ).toBeLessThan(20);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.locator(".device-dialog")).toContainText(block.id);
  await expect(page.locator(".device-dialog")).toContainText("kW");
  await page.keyboard.press("Escape");
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-liem-small-block-close.png" });
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, {
    steps: 8,
  });
  await page.mouse.up();
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-liem-small-block-rotated.png" });
  // Reproduce the low grazing angle from the user's screenshots, then zoom out.
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.3, {
    steps: 12,
  });
  await page.mouse.up();
  let previous = "";
  await expect
    .poll(async () => {
      const current = (await canvas.getAttribute("data-camera-position"))!;
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-liem-low-angle-filtered.png" });
  await page.mouse.wheel(0, 350);
  previous = "";
  await expect
    .poll(async () => {
      const current = (await canvas.getAttribute("data-camera-position"))!;
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-liem-low-angle-zoomed-out.png" });
  await expect(canvas).toHaveAttribute("data-pv-metalness", "0");
  await expect(canvas).toHaveAttribute("data-pv-specular", "0");
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha");
  await expect(canvas).toHaveAttribute("data-pv-material", "MeshBasicMaterial");
  const power = JSON.parse((await canvas.getAttribute("data-power-links"))!);
  expect(power[`${block.id}->INV-02`]).toBeDefined();
  const rendered = Object.values(power) as {
    role: string;
    lineWidth: number;
  }[];
  expect(
    rendered
      .filter((l) => l.role === "trunk")
      .every((l) => l.lineWidth === 5.5),
  ).toBe(true);
  expect(rendered.filter((l) => l.role === "branch")).toHaveLength(7);
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  const historyCanvas = page.locator(".history-scene-wrap canvas");
  await expect(historyCanvas).toBeVisible({ timeout: 30000 });
  const hp = await project(page, historyCanvas, position);
  await page.mouse.click(hp.x, hp.y);
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-selected-asset",
    block.id,
  );
  await expect(page.getByTestId("history-dashboard")).toContainText(
    "không có số đo riêng",
  );
  expect(errors).toEqual([]);
});

test("Mobile list pages small blocks and AI mentions use the exact child identity without changing Sava", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.includes("webgl")) return null;
      return original.call(this, kind as never, ...(args as never[]));
    } as typeof original;
  });
  const seen: any[] = [];
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { available: true, credentialStatus: "ready" },
      });
    const body = route.request().postDataJSON();
    seen.push(body.context);
    return route.fulfill({
      json: {
        key: contextKey(body.context),
        answer: "Thông số cụm nhỏ được phân bổ từ vùng PV-04.",
      },
    });
  });
  await page.goto("/plants/hong-liem-3");
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  const list = page.getByRole("dialog", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  await list
    .getByRole("combobox", { name: "Cấp chi tiết thiết bị" })
    .selectOption("PV-04");
  await expect(list.locator(".device-list-row")).toHaveCount(40);
  await list.getByRole("button", { name: "Trang tiếp", exact: true }).click();
  await expect(
    list.getByRole("button", { name: "PV-04-041", exact: true }),
  ).toBeVisible();
  await list.getByRole("searchbox", { name: "Tìm thiết bị" }).fill("PV-04-041");
  await list
    .getByRole("button", { name: "Xem chi tiết PV-04-041", exact: true })
    .click();
  await expect(page.locator(".device-dialog")).toContainText("PV-04-041");
  await page.keyboard.press("Escape");
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("@PV-04-041");
  await input.press("End");
  await expect(
    page.getByRole("listbox", { name: "Gợi ý thiết bị" }),
  ).toContainText("PV-04-041");
  await input.press("Enter");
  await input.fill("Phân tích PV-04-041");
  await input.press("Enter");
  await expect
    .poll(() =>
      seen.some(
        (s) => s.plantId === "hong-liem-3" && s.assetId === "PV-04-041",
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/plants/sava");
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Cấp chi tiết thiết bị" }),
  ).toHaveCount(0);
  await expect(page.locator(".device-list-row")).toHaveCount(19);
});

test("Distant low-angle overview stays filtered with one southern collector entry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/plants/hong-liem-3");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha", {
    timeout: 60000,
  });
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.48, {
    steps: 12,
  });
  await page.mouse.up();
  await page.mouse.move(box.x - 5, box.y);
  let previous = "";
  await expect
    .poll(async () => {
      const current = (await canvas.getAttribute("data-camera-position"))!;
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/hong-liem-distant-low-angle-bus.png" });
  await expect(canvas).toHaveAttribute("data-pv-material", "MeshBasicMaterial");
  const links = JSON.parse((await canvas.getAttribute("data-power-links"))!);
  expect(
    Object.keys(links).filter((id) =>
      /^INV-(01|02|03|04|10|11|12)->TR-01$/.test(id),
    ),
  ).toHaveLength(0);
  expect(
    Object.values(links).filter((l: any) => l.role === "branch"),
  ).toHaveLength(7);
  expect(
    Object.values(links)
      .filter((l: any) => l.role === "trunk")
      .every((l: any) => l.lineWidth === 5.5),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("Confirmed reference fields show seven and six narrow tables with count provenance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/hong-liem-3");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha", {
    timeout: 60000,
  });
  for (const [id, count] of [
    ["PV-11", 7],
    ["PV-12", 6],
  ] as const) {
    await page
      .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
      .click();
    const list = page.getByRole("dialog", {
      name: "Danh sách thiết bị",
      exact: true,
    });
    await list.getByRole("button", { name: id, exact: true }).click();
    await expect(page.locator(".scene-hud")).toContainText(`${count} cụm nhỏ`);
    await expect(page.locator(".scene-hud")).toContainText(
      "Số lượng người dùng xác nhận",
    );
    await expect(canvas).toHaveAttribute("data-focus-target", id);
    await page
      .locator(".scene-panel")
      .screenshot({ path: `test-results/hong-liem-${id}-confirmed-count.png` });
  }
});
