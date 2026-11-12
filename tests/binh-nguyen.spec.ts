import { test, expect } from "@playwright/test";
import {
  fields,
  groundPatches,
  photoToGround,
  detailToPhoto,
  equipmentRecesses,
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
  expect(profile.assets).toHaveLength(27);
  const ratings = profile.assets
    .filter((a) => a.type === "inverter")
    .map((a) => branchRating(a.id, "binh-nguyen"));
  expect(ratings.reduce((s, r) => s + r.dcMWp, 0)).toBeCloseTo(50, 10);
  expect(ratings.reduce((s, r) => s + r.acMW, 0)).toBeCloseTo(40, 10);
  const run = createMonitoringSnapshot("binh-nguyen"),
    links = buildPowerLinks(run.assets, "binh-nguyen");
  expect(links).toHaveLength(24);
  expect(
    links.filter((l) => l.kind === "AC").reduce((s, l) => s + l.powerMW!, 0),
  ).toBeCloseTo(run.powerMW!, 10);
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
  expect(contextKey(selection)).not.toBe(
    contextKey({
      ...selection,
      plantId: "hong-liem-3",
      config: { ...config, plantId: "hong-liem-3" },
    }),
  );
  const fault = createSession(
    { ...presetConfig("fault", config), target: "INV-12", scale: 1 },
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
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("12");
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
