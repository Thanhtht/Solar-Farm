import { routeBinhRoad, binhTerminals } from "../src/lib/binh-nguyen-cables";
import { test, expect } from "@playwright/test";
import {
  fields,
  groundPatches,
  photoToGround,
  detailToPhoto,
  equipmentRecesses,
  inverterPads,
} from "../src/data/binh-nguyen-layout";
import { insidePolygon } from "../src/data/hong-liem-layout";
import { getPlantProfile, branchRating } from "../src/data/plant-profiles";
import { getSiteBlocks, siteTableShare } from "../src/data/site-layout";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { buildPowerLinks } from "../src/lib/power-network";
import { resolvePlantAsset } from "../src/lib/plant-assets";
import { createSession, presetConfig } from "../src/lib/scenario-simulation";
import { initialSimulationConfig } from "../src/lib/assistant-actions";
import { buildAnalysis, contextKey } from "../src/lib/analysis";
import {
  createPerformanceHistory,
  historyRange,
} from "../src/lib/performance-history";
import { getHistoryBranches, getHistoryModel } from "../src/data/history-model";

test("Binh Nguyen geometry, ratings, children, history and context stay separate", () => {
  expect(fields).toHaveLength(12);
  expect(groundPatches).toHaveLength(2);
  for (const [fieldIndex, f] of fields.entries()) {
    expect(f.rows.length).toBeGreaterThan(0);
    for (const row of f.rows) {
      for (const [x0, y0, x1, y1] of equipmentRecesses[fieldIndex] ?? []) {
        const [a, b, c, d] = row.photoBounds;
        expect(c <= x0 || a >= x1 || d <= y0 || b >= y1).toBe(true);
      }
      expect(insidePolygon([row.position[0], row.position[2]], f.polygon)).toBe(
        true,
      );
      expect(row.position[2] < -18 || row.position[2] > 10).toBe(true);
      for (const dx of [-4.49, 4.49].map((v) => v * row.scale![0]))
        for (const dz of [-4.89, 4.89].map((v) => v * row.scale![2]))
          expect(
            insidePolygon(
              [row.position[0] + dx, row.position[2] + dz],
              f.polygon,
            ),
          ).toBe(true);
    }
  }
  expect(photoToGround([310, 300])).toEqual([0, 0]);
  const a = photoToGround([279, 91]),
    b = photoToGround([279, 108]),
    route = routeBinhRoad(a, b);
  expect(route).toHaveLength(2);
  expect(
    Math.hypot(route[1][0] - route[0][0], route[1][1] - route[0][1]),
  ).toBeCloseTo(17 * 0.32, 10);

  const first = fields[7].rows[0];
  expect(first.photoBounds[0]).toBeCloseTo(detailToPhoto([490, 176])[0], 0);
  expect(first.photoBounds[2] - first.photoBounds[0]).toBeLessThan(11);
  expect(
    new Set(fields[7].rows.map((r) => r.scale![0].toFixed(3))).size,
  ).toBeGreaterThan(2);
  for (const f of fields)
    for (const row of f.rows)
      expect(row.scale![0] * 9).toBeGreaterThan(row.scale![2] * 9.8);
  const shares = fields[11].rows.reduce(
    (n, _, i) => n + siteTableShare("binh-nguyen", 11, i),
    0,
  );
  expect(shares).toBeCloseTo(1, 10);
  const profile = getPlantProfile("binh-nguyen");
  expect(profile.assets).toHaveLength(22);
  expect(inverterPads).toHaveLength(7);
  expect(profile.assets.filter((a) => a.type === "inverter")).toHaveLength(7);
  for (const pad of inverterPads) {
    const inv = profile.assets.find((a) => a.id === pad.id)!;
    const [x0, y0, x1, y1] = pad.bounds,
      p = photoToGround(pad.photo);
    expect(inv.position[0]).toBe(p[0]);
    expect(inv.position[2]).toBe(p[1]);
    expect(
      pad.photo[0] > x0 &&
        pad.photo[0] < x1 &&
        pad.photo[1] > y0 &&
        pad.photo[1] < y1,
    ).toBe(true);
    expect(inv.related.filter((id) => id.startsWith("PV-"))).toEqual(pad.pvIds);
  }
  expect(
    profile.assets
      .find((a) => a.id === "GW-01")!
      .signals.find((s) => s.id.endsWith(".sources"))!.value,
  ).toBe(21);
  const ratings = profile.assets
    .filter((a) => a.type === "inverter")
    .map((a) => branchRating(a.id, "binh-nguyen"));
  expect(ratings.reduce((s, r) => s + r.dcMWp, 0)).toBeCloseTo(50, 10);
  expect(ratings.reduce((s, r) => s + r.acMW, 0)).toBeCloseTo(40, 10);
  const run = createMonitoringSnapshot("binh-nguyen"),
    links = buildPowerLinks(run.assets, "binh-nguyen");
  expect(links).toHaveLength(19);
  expect(
    links.filter((l) => l.kind === "AC").reduce((s, l) => s + l.powerMW!, 0),
  ).toBeCloseTo(run.powerMW!, 10);
  for (const inv of run.assets.filter((a) => a.type === "inverter")) {
    const inputs = run.assets.filter(
      (a) => a.type === "pv" && a.related.includes(inv.id),
    );
    const dc = inputs.reduce(
      (sum, a) => sum + a.signals.find((t) => t.id.endsWith(".pdc"))!.value!,
      0,
    );
    expect(inv.signals.find((s) => s.id.endsWith(".pac"))!.value).toBeCloseTo(
      Math.min(branchRating(inv.id, "binh-nguyen").acMW, dc * 0.96),
      10,
    );
  }
  for (const l of links) {
    expect(l.points.length).toBeGreaterThan(1);
    expect(l.points.flat().every(Number.isFinite)).toBe(true);
    if (l.kind === "AC") expect(l.points.length).toBeGreaterThan(3);
  }
  const child = resolvePlantAsset(run.assets, "PV-12-001", "binh-nguyen")!;
  expect(child.parentId).toBe("PV-12");
  expect(child.dataScope).toContain("Không có số đo riêng");
  expect(getSiteBlocks("binh-nguyen")).toHaveLength(
    fields.reduce((n, f) => n + f.rows.length, 0),
  );
  const config = {
    ...initialSimulationConfig,
    plantId: "binh-nguyen" as const,
  };
  const selection = {
    plantId: "binh-nguyen" as const,
    mode: "current" as const,
    assetId: child.id,
    revision: 1,
    submitted: false,
    config,
  };
  expect(buildAnalysis(selection).plantName).toContain("Bình Nguyên");
  expect(buildAnalysis(selection).equipmentInventory?.inverterCount).toBe(7);
  expect(contextKey(selection)).not.toBe(
    contextKey({
      ...selection,
      plantId: "hong-liem-3",
      config: { ...config, plantId: "hong-liem-3" },
    }),
  );
  const fault = createSession(
    { ...presetConfig("fault", config), target: "INV-07", scale: 1 },
    1,
    run,
  ).untreated;
  expect(
    resolvePlantAsset(fault.assets, child.id, "binh-nguyen")!.operatingState,
  ).toBe("stopped");
  const data = createPerformanceHistory({
    now: new Date("2026-11-12T05:00:00Z"),
    plantId: "binh-nguyen",
  });
  expect(getHistoryBranches("binh-nguyen")).toHaveLength(12);
  expect(getHistoryModel("binh-nguyen").seed).not.toBe(
    getHistoryModel("hong-liem-3").seed,
  );
  const range = { start: "2026-11-11", end: "2026-11-11" };
  const parent = historyRange(data, range, "PV-12"),
    sub = historyRange(data, range, child.id);
  expect(
    sub.summary.expectedEnergyMWh / siteTableShare("binh-nguyen", 11, 0),
  ).toBeCloseTo(parent.summary.expectedEnergyMWh, 10);
});

test("Binh Nguyen shares dashboard, detailed selection, simulation and statistics", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/");
  await page
    .getByRole("link", {
      name: "Khám phá Nhà máy điện Bình Nguyên",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/plants\/binh-nguyen$/);
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-plant-id", "binh-nguyen", {
    timeout: 60000,
  });
  await expect(canvas).toHaveAttribute(
    "data-pv-rows",
    String(fields.reduce((n, f) => n + f.rows.length, 0)),
  );
  await expect(canvas).toHaveAttribute(
    "data-stable-support-tables",
    String(fields.reduce((n, f) => n + f.rows.length, 0)),
  );
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha");
  await page.screenshot({
    path: "test-results/binh-nguyen-overview.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  let list = page.getByRole("dialog", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  await list
    .getByRole("combobox", { name: "Cấp chi tiết thiết bị" })
    .selectOption("PV-12");
  await list.getByRole("button", { name: "PV-12-001", exact: true }).click();
  await expect(page.locator(".scene-hud")).toContainText("PV-12-001");
  await expect(page.locator(".scene-hud")).toContainText("Ước lượng theo ảnh");
  await expect(canvas).toHaveAttribute("data-focus-target", "PV-12-001");
  await expect(canvas).toHaveAttribute(
    "data-stable-support-tables",
    String(fields.reduce((n, f) => n + f.rows.length, 0)),
  );
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.4,
    bounds.y + bounds.height * 0.6,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.55,
    bounds.y + bounds.height * 0.53,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(canvas).toHaveAttribute(
    "data-stable-support-tables",
    String(fields.reduce((n, f) => n + f.rows.length, 0)),
  );
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/binh-nguyen-stable-legs-rotated.png" });
  await page.mouse.wheel(0, 400);
  await expect(canvas).toHaveAttribute(
    "data-stable-support-tables",
    String(fields.reduce((n, f) => n + f.rows.length, 0)),
  );
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("7");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("simple-energy-loss")).not.toHaveText("—");
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await expect(page.getByTestId("history-dashboard")).toBeVisible();
  await page.screenshot({
    path: "test-results/binh-nguyen-history.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("Binh Nguyen mobile fallback keeps all modules and child selection", async ({
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
      return kind.includes("webgl")
        ? null
        : original.call(this, kind as never, ...(args as never[]));
    } as typeof original;
  });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/binh-nguyen");
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  const list = page.getByRole("dialog", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  await list
    .getByRole("combobox", { name: "Cấp chi tiết thiết bị" })
    .selectOption("PV-01");
  await list
    .getByRole("button", { name: "Xem chi tiết PV-01-001", exact: true })
    .click();
  await expect(page.locator(".device-dialog")).toContainText("PV-01-001");
  await page.keyboard.press("Escape");
  for (const name of ["Mô phỏng", "Thống kê"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/binh-nguyen-mobile.png",
    fullPage: true,
  });
});

test("AI reconstructs Binh Nguyen facts and excludes other-plant or unscoped chat", async () => {
  const { createAiService } = await import("../src/lib/server/ai");
  let request = "";
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-key",
    }),
    now: () => Date.parse("2026-11-12T05:00:00Z"),
    fetch: async (_url, init) => {
      request = String(init!.body);
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ text: "Phân tích dữ liệu giả định Bình Nguyên." }],
            },
          },
        ],
      });
    },
  });
  const config = {
    ...initialSimulationConfig,
    plantId: "binh-nguyen" as const,
  };
  const context = {
    plantId: "binh-nguyen" as const,
    mode: "current" as const,
    assetId: "PV-12-001",
    revision: 1,
    submitted: false,
    config,
  };
  const result = await service.respond({
    kind: "chat",
    context,
    question: "Phân tích PV-12-001",
    history: [
      { role: "user", content: "UNSCOPED_TEST_MARKER" },
      {
        role: "user",
        content: "OTHER_PLANT_TEST_MARKER",
        context: {
          ...context,
          assetId: null,
          plantId: "sava",
          config: { ...config, plantId: "sava" },
        },
      },
    ],
  });
  expect(result.key).toContain("binh-nguyen");
  expect(request).toContain("Bình Nguyên");
  expect(request).not.toContain("UNSCOPED_TEST_MARKER");
  expect(request).not.toContain("OTHER_PLANT_TEST_MARKER");
});

test("Horizontal stepped PV-08 can be inspected against the detailed reference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/binh-nguyen");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-pv-filtering", "mipmap-alpha", {
    timeout: 60000,
  });
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Danh sách thiết bị", exact: true })
    .getByRole("button", { name: "PV-08", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-focus-target", "PV-08");
  await canvas.scrollIntoViewIfNeeded();
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.55, {
    steps: 12,
  });
  await page.mouse.up();
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/binh-horizontal-PV08-reference.png" });
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  const list = page.getByRole("dialog", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  await list
    .getByRole("combobox", { name: "Cấp chi tiết thiết bị" })
    .selectOption("PV-08");
  await list.getByRole("button", { name: "PV-08-001", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-focus-target", "PV-08-001");
  await expect(page.locator(".scene-hud")).toContainText("PV-08-001");
});

test("Every observed inverter body fits its reserved pad and no PV table overlaps a pad", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { Box3, Vector3 } = await import("three");
  const buffer = await readFile("public/inverter/inverter.glb");
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    "",
  );
  const assets = getPlantProfile("binh-nguyen").assets;
  for (const pad of inverterPads) {
    const asset = assets.find((a) => a.id === pad.id)!,
      model = gltf.scene.clone(true);
    model.scale.set(...asset.modelScale!);
    model.rotation.y = asset.modelRotation!;
    model.position.set(...asset.position);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model, true),
      a = photoToGround([pad.bounds[0], pad.bounds[1]]),
      b = photoToGround([pad.bounds[2], pad.bounds[3]]);
    expect(box.min.x).toBeGreaterThanOrEqual(a[0] - 1e-6);
    expect(box.max.x).toBeLessThanOrEqual(b[0] + 1e-6);
    expect(box.min.z).toBeGreaterThanOrEqual(a[1] - 1e-6);
    expect(box.max.z).toBeLessThanOrEqual(b[1] + 1e-6);
    const size = box.getSize(new Vector3());
    expect(size.x).toBeGreaterThan(size.z);
    for (const field of fields)
      for (const table of field.rows) {
        const [x0, y0, x1, y1] = table.photoBounds;
        expect(
          x1 <= pad.bounds[0] ||
            x0 >= pad.bounds[2] ||
            y1 <= pad.bounds[1] ||
            y0 >= pad.bounds[3],
        ).toBe(true);
      }
  }
});

test("Three southern inverters focus inside the visible equipment recesses", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/binh-nguyen");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-plant-id", "binh-nguyen", {
    timeout: 60000,
  });
  for (const id of ["INV-05", "INV-06", "INV-07"]) {
    await page
      .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
      .click();
    const list = page.getByRole("dialog", {
      name: "Danh sách thiết bị",
      exact: true,
    });
    await list.getByRole("button", { name: id, exact: true }).click();
    await expect(canvas).toHaveAttribute("data-focus-target", id);
    await expect(page.locator(".scene-hud")).toContainText("1 bệ = 1 inverter");
    await page
      .locator(".scene-panel")
      .screenshot({ path: `test-results/binh-pad-${id}.png` });
  }
});

test("Binh inverter cables enter DC array side and leave AC road side without pad diagonals", () => {
  const run = createMonitoringSnapshot("binh-nguyen");
  const links = buildPowerLinks(run.assets, "binh-nguyen");
  for (const inv of run.assets.filter((a) => a.type === "inverter")) {
    const t = binhTerminals(inv);
    const incoming = links.filter((l) => l.kind === "DC" && l.to === inv.id);
    const outgoing = links.find((l) => l.kind === "AC" && l.from === inv.id)!;
    expect(incoming.length).toBeGreaterThan(0);
    expect((t.dc[0] - inv.position[0]) * t.side).toBeLessThan(0);
    expect((t.ac[0] - inv.position[0]) * t.side).toBeGreaterThan(0);
    expect(outgoing.points[0]).toEqual([t.ac[0], 0.24, t.ac[1]]);
    expect(outgoing.points[1][2]).toBe(t.ac[1]);
    for (const l of incoming) {
      expect(l.points.at(-1)).toEqual([t.dc[0], 0.24, t.dc[1]]);
      const last = l.points.slice(-2);
      expect(last[0][2]).toBeCloseTo(last[1][2], 8);
      // The last span comes from the array side, never across the cabinet.
      expect((last[0][0] - t.dc[0]) * t.side).toBeLessThan(0);
      expect(l.powerMW).toBe(
        run.assets
          .find((a) => a.id === l.from)!
          .signals.find((s) => s.id.endsWith(".pdc"))!.value,
      );
      for (let i = 1; i < l.points.length; i++)
        expect(
          Math.hypot(
            l.points[i][0] - l.points[i - 1][0],
            l.points[i][2] - l.points[i - 1][2],
          ),
        ).toBeGreaterThan(1e-6);
    }
  }
  const stopped = links.find((l) => l.from === "PV-06")!;
  expect(stopped.state).toBe("stopped");
  expect(stopped.running).toBe(false);
});

test("Focused inverter and table show explicit DC to AC direction without duplicate regional flow", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/binh-nguyen");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-plant-id", "binh-nguyen", {
    timeout: 60000,
  });
  for (const id of ["INV-03", "INV-05", "PV-06-162"]) {
    await page
      .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
      .click();
    const list = page.getByRole("dialog", {
      name: "Danh sách thiết bị",
      exact: true,
    });
    const search = list.getByRole("searchbox");
    await search.fill(id);
    await list.getByRole("button", { name: id, exact: true }).click();
    await expect(canvas).toHaveAttribute("data-focus-target", id);
    await expect(page.locator('[data-power-terminal="DC"]')).toContainText(
      "DC vào · Pin →",
    );
    await expect(page.locator('[data-power-terminal="AC"]')).toContainText(
      "→ TR-01",
    );
    if (id.startsWith("PV-")) {
      const links = JSON.parse(
        (await canvas.getAttribute("data-power-links"))!,
      );
      expect(links["PV-06->INV-03"]).toBeUndefined();
      expect(links["PV-06-162->INV-03"].running).toBe(false);
    }
    await page
      .locator(".scene-panel")
      .screenshot({ path: `test-results/binh-flow-${id}.png` });
  }
});
