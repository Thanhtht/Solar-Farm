import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import {
  hongLiemCamera,
  hongLiemFields,
  insidePolygon,
  photoToGround,
  pvRowRotation,
  pvRowScale,
  vegetationIsland,
} from "../src/data/hong-liem-layout";
import { getPlantProfile, branchRating } from "../src/data/plant-profiles";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import {
  createSession,
  forecast,
  presetConfig,
} from "../src/lib/scenario-simulation";
import { monitoringMetrics } from "../src/lib/monitoring-metrics";
import {
  createPerformanceHistory,
  historyRange,
} from "../src/lib/performance-history";
import {
  buildAnalysis,
  contextKey,
  parseSelection,
  type AnalysisSelection,
} from "../src/lib/analysis";
import {
  initialSimulationConfig,
  actionFromFunction,
  selectionAfterAction,
} from "../src/lib/assistant-actions";
import { historyAnalysis } from "../src/lib/history-analysis";
import { createAiService } from "../src/lib/server/ai";
test("Satellite plan preserves stepped polygons, island gaps and variable-length rack footprints", () => {
  expect(photoToGround([330, 370])).toEqual([0, 0]);
  for (const field of hongLiemFields) {
    expect(field.rows.length).toBeGreaterThan(0);
    for (const row of field.rows) {
      expect(
        insidePolygon([row.position[0], row.position[2]], field.polygon),
      ).toBe(true);
      expect(
        insidePolygon([row.position[0], row.position[2]], vegetationIsland),
      ).toBe(false);
      for (const corner of row.photoBounds)
        expect(insidePolygon(photoToGround(corner), field.polygon)).toBe(true);
      expect(row.scale![0] * 9).toBeGreaterThan(row.scale![2] * 9.8);
    }
  }
});

const hongConfig = {
  ...initialSimulationConfig,
  plantId: "hong-liem-3" as const,
};
const hongSelection: AnalysisSelection = {
  plantId: "hong-liem-3",
  mode: "current",
  assetId: null,
  revision: 1,
  submitted: false,
  config: hongConfig,
};

test("Shared engine uses Hong Liem ratings and topology without changing Sava; history and identities stay separated", () => {
  const profile = getPlantProfile("hong-liem-3"),
    current = createMonitoringSnapshot("hong-liem-3"),
    sava = createMonitoringSnapshot();
  expect(profile.assets).toHaveLength(21);
  expect(current.assets).toHaveLength(21);
  expect(current.assets.filter((a) => a.type === "inverter")).toHaveLength(5);
  expect(
    profile.assets
      .filter((a) => a.type === "inverter")
      .reduce((s, a) => s + branchRating(a.id, "hong-liem-3").dcMWp, 0),
  ).toBeCloseTo(50, 10);
  expect(current.powerMW).toBeCloseTo(
    current.assets
      .filter((a) => a.type === "inverter")
      .reduce((sum, a) => sum + a.signals[0].value!, 0),
    10,
  );
  expect(monitoringMetrics(current).loss.at(-1)).toBeCloseTo(
    current.lossMWh,
    10,
  );
  expect(current.powerMW).not.toBeCloseTo(sava.powerMW!, 4);
  const config = {
    ...presetConfig("fault", hongConfig),
    scale: 5,
    duration: 1440,
  };
  const estimate = forecast(config, current),
    session = createSession(config, 1, current);
  expect(session.untreated.powerMW).toBe(0);
  expect(
    session.untreated.assets.filter((a) => a.type === "inverter" && a.scenario),
  ).toHaveLength(5);
  expect(estimate.lossMWh).toBeCloseTo(current.powerMW! * 24, 8);
  expect(createMonitoringSnapshot()).toEqual(sava);
  expect(() =>
    createSession({ ...config, plantId: "sava" }, 1, current),
  ).toThrow();
  expect(parseSelection({ ...hongSelection, assetId: "INV-05" }).assetId).toBe(
    "INV-05",
  );
  expect(() =>
    parseSelection({ ...hongSelection, plantId: "sava", assetId: "INV-12" }),
  ).toThrow();
  expect(() =>
    parseSelection({ ...hongSelection, plantId: "unknown" }),
  ).toThrow();
  expect(contextKey(hongSelection)).not.toBe(
    contextKey({
      ...hongSelection,
      plantId: "sava",
      config: initialSimulationConfig,
    }),
  );
  const action = actionFromFunction(
    "set_simulation",
    { kind: "fault", target: "INV-05", scale: 1, apply: true },
    { ...hongSelection, mode: "simulation" },
  );
  const next = selectionAfterAction(action, {
    ...hongSelection,
    mode: "simulation",
  });
  expect(buildAnalysis(next).plantId).toBe("hong-liem-3");
  const now = new Date("2026-11-11T05:00:00Z"),
    history = createPerformanceHistory({ now, plantId: "hong-liem-3" });
  expect(historyRange(history, history.window).byAsset).toHaveLength(13);
  const facts = historyAnalysis(
    {
      plantId: "hong-liem-3",
      mode: "history",
      start: history.window.end,
      end: history.window.end,
      assetId: "PV-12",
    },
    now,
  );
  expect(facts.plantName).toBe("Hồng Liêm 3");
  expect(facts.byAsset).toHaveLength(1);
  expect(history.seed).not.toBe(createPerformanceHistory({ now }).seed);
});

test("AI reconstructs Hong Liem current/history facts, tools and cache keys from trusted plant identity", async () => {
  const requests: any[] = [];
  const service = createAiService({
    config: () => ({
      endpoint: "https://provider.invalid",
      model: "test",
      apiKey: "synthetic-key",
    }),
    now: () => Date.parse("2026-11-11T05:00:00Z"),
    fetch: async (_url, init) => {
      requests.push(JSON.parse(init!.body as string));
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ text: "Phân tích từ dữ kiện của nhà máy đang chọn." }],
            },
          },
        ],
      });
    },
  });
  const ask = (context: unknown, question = "Phân tích nhà máy") =>
    service.respond({ kind: "chat", context, question, history: [] });
  const result = await ask(hongSelection),
    sava = await ask({
      ...hongSelection,
      plantId: "sava",
      config: initialSimulationConfig,
    });
  expect(result.key).not.toBe(sava.key);
  const facts = JSON.parse(requests[0].contents[0].parts[0].text).CONTEXT_JSON;
  expect(facts.plantId).toBe("hong-liem-3");
  expect(facts.plantAssets).toHaveLength(21);
  expect(requests[0].systemInstruction.parts[0].text).toContain("Hồng Liêm 3");
  expect(requests[0].systemInstruction.parts[0].text).not.toContain(
    "nhà máy điện Sava",
  );
  await ask({ ...hongSelection, mode: "simulation" });
  const tools =
    requests[2].tools[0].functionDeclarations[0].parameters.properties;
  expect(tools.scale.maximum).toBe(5);
  expect(tools.target.enum).toContain("INV-05");
  await ask({
    plantId: "hong-liem-3",
    mode: "history",
    start: "2026-11-10",
    end: "2026-11-10",
    assetId: "PV-12",
  });
  const historical = JSON.parse(
    requests[3].contents[0].parts[0].text,
  ).CONTEXT_JSON;
  expect(historical.plantId).toBe("hong-liem-3");
  expect(historical.assetId).toBe("PV-12");
  expect(requests[3].tools).toBeUndefined();
  await service.respond({
    kind: "chat",
    context: hongSelection,
    question: "INV-05 hiện thế nào?",
    history: [
      {
        role: "assistant",
        content: "Lịch sử riêng của Sava",
        context: {
          ...hongSelection,
          plantId: "sava",
          config: initialSimulationConfig,
        },
      },
    ],
  });
  const isolated = JSON.parse(requests[4].contents[0].parts[0].text);
  expect(isolated.HISTORY).toEqual([]);
  expect(isolated.ANSWER_DEVICE.id).toBe("INV-05");
});

async function offline(page: import("@playwright/test").Page) {
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
}

test("Hong Liem uses Sava's three tabs, KPI details, device dialogs, AI mentions and full simulation controls", async ({
  page,
}) => {
  await offline(page);
  const seen: AnalysisSelection[] = [];
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { available: true, credentialStatus: "ready" },
      });
    const body = route.request().postDataJSON();
    seen.push(body.context);
    if (body.context.mode === "history")
      return route.fulfill({
        json: {
          key: historyAnalysis(body.context, new Date(), body.question).key,
          answer: "Dữ liệu lịch sử Hồng Liêm 3 đã được phân tích.",
          source: "AI API · kiểm thử",
        },
      });
    if (
      body.kind === "chat" &&
      body.context.mode === "simulation" &&
      body.question === "Chạy riêng INV-05"
    )
      return route.fulfill({
        json: {
          key: contextKey(body.context),
          answer: "Đã áp dụng cho inverter 5.",
          action: actionFromFunction(
            "set_simulation",
            {
              kind: "fault",
              target: "INV-05",
              scale: 1,
              durationHours: 1,
              apply: true,
            },
            body.context,
          ),
        },
      });
    return route.fulfill({
      json: {
        key: contextKey(body.context),
        answer: "Đang xem dữ liệu giả định Hồng Liêm 3.",
        source: "AI API · kiểm thử",
      },
    });
  });
  await page.goto("/plants/hong-liem-3");
  await expect(page.locator(".topbar .view-tabs [role=tab]")).toHaveText([
    "Hiện trạng",
    "Mô phỏng",
    "Thống kê",
  ]);
  await expect(page.locator(".hl3-header,.hl3-sidebar")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Hồng Liêm 3/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Công suất AC/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Công suất AC" }),
  ).toContainText("5 inverter");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  const list = page.getByRole("dialog", { name: /Danh sách thiết bị/ });
  await expect(list.locator(".device-list-row")).toHaveCount(21);
  await list.getByRole("searchbox", { name: "Tìm thiết bị" }).fill("INV-05");
  await list
    .getByRole("button", { name: "Xem chi tiết INV-05", exact: true })
    .click();
  await expect(page.locator(".device-dialog")).toContainText("INV-05");
  await page.keyboard.press("Escape");
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("@INV-05");
  await input.press("End");
  await expect(
    page.getByRole("listbox", { name: "Gợi ý thiết bị" }),
  ).toContainText("INV-05");
  await input.press("Escape");
  await input.fill("Phân tích INV-05");
  await input.press("Enter");
  await expect
    .poll(() =>
      seen.some((s) => s.plantId === "hong-liem-3" && s.assetId === "INV-05"),
    )
    .toBe(true);
  const before = await page.locator(".kpis").textContent();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("5");
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("24");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  const expected = forecast(
    { ...presetConfig("fault", hongConfig), scale: 5, duration: 1440 },
    createMonitoringSnapshot("hong-liem-3"),
  ).lossMWh;
  await expect(page.getByTestId("simple-energy-loss")).toContainText(
    expected.toLocaleString("vi-VN", { maximumFractionDigits: 2 }),
  );
  await input.fill("Chạy riêng INV-05");
  await input.press("Enter");
  await expect(
    page.getByLabel("Quy mô ảnh hưởng", { exact: true }),
  ).toHaveValue("1");
  const single = forecast(
    {
      ...presetConfig("fault", hongConfig),
      target: "INV-05",
      scale: 1,
      duration: 60,
    },
    createMonitoringSnapshot("hong-liem-3"),
  ).lossMWh;
  await expect(page.getByTestId("simple-energy-loss")).toContainText(
    single.toLocaleString("vi-VN", { maximumFractionDigits: 2 }),
  );
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis")).toHaveText(before!);
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await expect(page.locator(".history-toolbar")).toBeVisible();
  await expect(page.locator(".history-assistant")).toBeVisible();
  await expect(page.locator(".history-assets tbody tr")).toHaveCount(13);
  const historyInput = page.getByRole("textbox", { name: "Hỏi AI lịch sử" });
  await historyInput.fill("Phân tích PV-12");
  await historyInput.press("Enter");
  await expect(page.locator(".history-chat-log")).toContainText(
    "Dữ liệu lịch sử Hồng Liêm 3 đã được phân tích.",
  );
  await page.screenshot({
    path: "test-results/hong-liem-shared-history.png",
    fullPage: true,
  });
});

test("Shared Hong Liem renderer retains photo geometry, selection, focus and scenario effects", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  await page.goto("/plants/hong-liem-3");
  const canvas = page.locator("#plant-view canvas");
  await expect(canvas).toHaveAttribute("data-plant-id", "hong-liem-3", {
    timeout: 45000,
  });
  await expect(canvas).toHaveAttribute(
    "data-pv-rows",
    String(hongLiemFields.reduce((s, f) => s + f.rows.length, 0)),
  );
  await page.screenshot({
    path: "test-results/hong-liem-shared-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Mở danh sách thiết bị", exact: true })
    .click();
  const list = page.getByRole("dialog", { name: /Danh sách thiết bị/ });
  await list.getByRole("searchbox", { name: "Tìm thiết bị" }).fill("INV-05");
  await list.getByRole("button", { name: "INV-05", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-focus-target", "INV-05", {
    timeout: 15000,
  });
  await expect(page.locator(".scene-hud")).toContainText("INV-05");
  await page
    .getByRole("button", { name: "Góc nhìn tổng quan", exact: true })
    .click();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("5");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        Object.keys(
          JSON.parse((await canvas.getAttribute("data-device-colors")) ?? "{}"),
        ).filter((id) => id.startsWith("PV-")).length,
    )
    .toBe(13);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
    .click();
  await page
    .locator("#plant-view")
    .screenshot({ path: "test-results/hong-liem-shared-mobile.png" });
});
