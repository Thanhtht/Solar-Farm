import { test, expect, type Page } from "@playwright/test";
import {
  createPerformanceHistory,
  historyRange,
} from "../src/lib/performance-history";
import { heatmapColor } from "../src/lib/history-presentation";
import { contextKey } from "../src/lib/analysis";
import { actionFromFunction } from "../src/lib/assistant-actions";
const now = new Date("2026-11-04T05:00:00Z");
const fixed = createPerformanceHistory({ now });
const number = (n: number | null) =>
  n === null
    ? "—"
    : n.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

async function open(page: Page, webgl = false) {
  await page.clock.setFixedTime(now);
  if (!webgl)
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (type === "webgl2") return null;
        return getContext.call(this, type as "2d", ...(args as []));
      } as typeof getContext;
    });
  await page.goto("/");
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-today",
    "2026-11-04",
  );
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("range");
  await page
    .getByRole("group", { name: "Khoảng thời gian chọn nhanh" })
    .getByRole("button", { name: "7 ngày", exact: true })
    .click();
}
async function openRange(page: Page) {
  const box = page.getByLabel("Khoảng thời gian đang chọn", { exact: true });
  if (!(await box.evaluate((el) => el.parentElement!.hasAttribute("open"))))
    await box.click();
}
async function range(page: Page, start: string, end = start) {
  await openRange(page);
  const form = page.getByRole("form", { name: "Khoảng phân tích" });
  await form.getByLabel("Khoảng phân tích: từ ngày").fill(start);
  await form.getByLabel("Khoảng phân tích: đến ngày").fill(end);
  await form.getByRole("button", { name: "Áp dụng", exact: true }).click();
}
async function readings(
  page: Page,
  start: string,
  end: string,
  assetId?: string,
) {
  const expected = historyRange(fixed, { start, end }, assetId).summary;
  await expect(
    page.getByTestId("history-kpi-energy").locator("strong"),
  ).toContainText(number(expected.actualEnergyMWh));
  await expect(
    page.getByTestId("history-kpi-performance").locator("strong"),
  ).toContainText(number(expected.performancePct));
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-scope-start",
    start,
  );
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-scope-end",
    end,
  );
}

test("Quick periods, custom dates, day slider and chart share the same aggregate", async ({
  page,
}) => {
  await open(page);
  await readings(page, "2026-10-28", "2026-11-03");
  const quick = page.getByRole("group", {
    name: "Khoảng thời gian chọn nhanh",
  });
  for (const [label, start] of [
    ["1 ngày", "2026-11-03"],
    ["3 ngày", "2026-11-01"],
    ["7 ngày", "2026-10-28"],
    ["Tất cả", "2026-10-04"],
  ]) {
    await quick.getByRole("button", { name: label, exact: true }).click();
    await readings(page, start, "2026-11-03");
  }
  await range(page, "2026-10-16", "2026-10-22");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-03");
  await readings(page, "2026-10-16", "2026-10-22", "PV-03");
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("day");
  await readings(page, "2026-11-03", "2026-11-03", "PV-03");
  const slider = page.getByRole("slider", { name: "Chọn ngày trên timeline" });
  await slider.focus();
  await page.keyboard.press("Home");
  await readings(page, "2026-10-04", "2026-10-04", "PV-03");
  await page.keyboard.press("ArrowRight");
  await readings(page, "2026-10-05", "2026-10-05", "PV-03");
});

test("Custom input rejects today, future, outside history and reversed dates without changing results", async ({
  page,
}) => {
  await open(page);
  await openRange(page);
  const start = page.getByLabel("Khoảng phân tích: từ ngày");
  await expect(start).toHaveAttribute("min", "2026-10-04");
  await expect(start).toHaveAttribute("max", "2026-11-03");
  for (const [a, b] of [
    ["2026-11-04", "2026-11-04"],
    ["2026-11-03", "2026-11-05"],
    ["2026-10-03", "2026-10-05"],
    ["2026-11-03", "2026-11-01"],
  ]) {
    await range(page, a, b);
    await expect(
      page.getByRole("alert").filter({ hasText: "ngày kết thúc" }),
    ).toBeVisible();
    await readings(page, "2026-10-28", "2026-11-03");
  }
  await range(page, "2026-10-04");
  await readings(page, "2026-10-04", "2026-10-04");
});

test("Leaving for history cancels pending AI actions even after returning to simulation and preserves drafts", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let settled: (() => void) | undefined;
  const finished = new Promise<void>((resolve) => {
    settled = resolve;
  });
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    if (body.kind !== "chat")
      return route.fulfill({
        json: { key: contextKey(body.context), answer: "Nhận định kiểm thử." },
      });
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await route.fulfill({
        json: {
          key: contextKey(body.context),
          answer: "Áp dụng lỗi.",
          action: actionFromFunction(
            "set_simulation",
            { kind: "fault", scale: 8, durationHours: 24, apply: true },
            body.context,
          ),
        },
      });
    } catch {
      /* Browser may have cancelled the request while the response was gated. */
    } finally {
      settled?.();
    }
  });
  await open(page);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  await input.fill("Cho 8 inverter dừng trong 24 giờ");
  await input.press("Enter");
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  release!();
  await finished;
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("");
  await expect(input).toHaveValue("Cho 8 inverter dừng trong 24 giờ");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
});

test.describe("History touch interaction", () => {
  test.use({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  test("Touch picking works on the actual mobile heatmap", async ({ page }) => {
    test.setTimeout(90000);
    await open(page, true);
    await range(page, "2026-10-20", "2026-10-22");
    const canvas = page.locator("#history-view canvas");
    await expect(canvas).toHaveAttribute("data-device-projections", /PV-02/, {
      timeout: 25000,
    });
    await canvas.scrollIntoViewIfNeeded();
    const rect = (await canvas.boundingBox())!;
    const points = JSON.parse(
      (await canvas.getAttribute("data-device-projections"))!,
    );
    await page.touchscreen.tap(
      rect.x + points["PV-02"][0] * rect.width,
      rect.y + points["PV-02"][1] * rect.height,
    );
    await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
      "data-selected-asset",
      "PV-02",
    );
    await page
      .getByRole("button", { name: "Góc nhìn tổng quan", exact: true })
      .click();
    await expect(canvas).toHaveAttribute("data-camera-moving", "false", {
      timeout: 15000,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: "test-results/history-touch.png",
      fullPage: true,
    });
  });
});

test("Zero production, partial observations and no observations have distinct states", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-03");
  await range(page, "2026-10-21");
  await readings(page, "2026-10-21", "2026-10-21", "PV-03");
  await expect(page.getByTestId("history-kpi-energy")).toContainText("0,00");
  const tableToggle = page.locator(
    ".history-assets .history-section-title button",
  );
  if ((await tableToggle.getAttribute("aria-expanded")) === "false")
    await tableToggle.click();
  await expect(
    page.locator(".history-assets tbody tr[aria-selected=true]"),
  ).toContainText("100,0%");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-08");
  await range(page, "2026-10-25");
  await readings(page, "2026-10-25", "2026-10-25", "PV-08");
  await expect(
    page.locator(".history-assets tbody tr[aria-selected=true]"),
  ).toContainText("75,0%");
  await expect(page.locator(".history-data-note")).toBeVisible();
  await page.locator(".history-compare-disclosure > summary").click();
  await expect(page.locator(".history-comparison")).toContainText(
    "không tính % thay đổi sản lượng",
  );
  await range(page, "2026-10-26");
  await readings(page, "2026-10-26", "2026-10-26", "PV-08");
  await expect(
    page.getByTestId("history-kpi-energy").locator("strong"),
  ).toContainText("—");
  await expect(page.locator(".history-detail")).toContainText(
    "Mô phỏng mất dữ liệu cả ngày",
  );
});

test("Comparison supports custom unequal periods and reports unavailable history without clipping", async ({
  page,
}) => {
  await open(page);
  await page.locator(".history-compare-disclosure > summary").click();
  await page
    .getByRole("group", { name: "Khoảng thời gian chọn nhanh" })
    .getByRole("button", { name: "Tất cả", exact: true })
    .click();
  await expect(page.locator(".history-comparison")).toContainText(
    "Không đủ dữ liệu",
  );
  await range(page, "2026-10-17", "2026-10-19");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-01");
  await page.getByLabel("Chọn kỳ đối chiếu").selectOption("custom");
  const form = page.getByRole("form", { name: "Khoảng đối chiếu" });
  await form.getByLabel("Khoảng đối chiếu: từ ngày").fill("2026-10-04");
  await form.getByLabel("Khoảng đối chiếu: đến ngày").fill("2026-10-05");
  await form.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator(".history-comparison")).toContainText(
    "Hai kỳ khác số ngày",
  );
  await expect(page.locator(".history-compare-columns")).toContainText(
    "04/10/2026 – 05/10/2026",
  );
  await expect(page.locator(".history-comparison-delta")).toContainText(
    "điểm %",
  );
});

test("Heatmap changes real PV material colors, supports 3D picking and keeps the camera while changing dates", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page, true);
  await range(page, "2026-10-21");
  const canvas = page.locator("#history-view canvas");
  await expect(canvas).toHaveAttribute("data-device-colors", /PV-03/, {
    timeout: 25000,
  });
  const colors = () =>
    canvas.getAttribute("data-device-colors").then((s) => JSON.parse(s!));
  await expect
    .poll(async () => (await colors())["PV-03"])
    .toBe(heatmapColor(0, "performance", 1).slice(1));
  await expect(canvas).toHaveAttribute("data-power-links", "{}");
  await page
    .getByRole("button", { name: "Sản lượng · MWh", exact: true })
    .click();
  await expect
    .poll(async () => (await colors())["PV-03"])
    .toBe(heatmapColor(0, "energy", 1).slice(1));
  await canvas.scrollIntoViewIfNeeded();
  const positions = JSON.parse(
    (await canvas.getAttribute("data-device-projections"))!,
  );
  const rect = (await canvas.boundingBox())!;
  await page.mouse.click(
    rect.x + positions["PV-05"][0] * rect.width,
    rect.y + positions["PV-05"][1] * rect.height,
  );
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-selected-asset",
    "PV-05",
  );
  await expect(canvas).toHaveAttribute("data-camera-moving", "false", {
    timeout: 15000,
  });
  const camera = await canvas.getAttribute("data-camera-position");
  await range(page, "2026-10-26");
  await expect.poll(async () => (await colors())["PV-08"]).toBe("94a3b8");
  await expect(canvas).toHaveAttribute("data-camera-position", camera!);
  await page.screenshot({
    path: "test-results/history-desktop.png",
    fullPage: true,
  });
});

test("Three modules retain independent selections, configuration and history filters", async ({
  page,
}) => {
  await open(page);
  await range(page, "2026-10-16", "2026-10-22");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-05");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  const loss = await page.getByTestId("simple-energy-loss").textContent();
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await readings(page, "2026-10-16", "2026-10-22", "PV-05");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis")).toContainText("30,15");
  await expect(page.locator(".kpis")).toContainText("15,72");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("fault");
  await expect(page.getByTestId("simple-energy-loss")).toHaveText(loss!);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Thống kê", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("tab", { name: "Hiện trạng", exact: true }),
  ).toBeFocused();
});

test("Plant midnight refresh updates the window, presets and date limits", async ({
  page,
}) => {
  await open(page);
  await openRange(page);
  await page
    .getByRole("group", { name: "Khoảng thời gian chọn nhanh" })
    .getByRole("button", { name: "7 ngày", exact: true })
    .click();
  await page.clock.setFixedTime(new Date("2026-11-04T17:00:01Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-today",
    "2026-11-05",
  );
  await openRange(page);
  await expect(page.getByLabel("Khoảng phân tích: đến ngày")).toHaveAttribute(
    "max",
    "2026-11-04",
  );
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-scope-end",
    "2026-11-04",
  );
});

test("Mobile/tablet layouts stay within the viewport and work without WebGL", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByText("WebGL chưa khả dụng", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-08");
    await expect(page.locator(".history-detail")).toContainText(
      "Chi tiết PV-08",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/history-mobile.png",
    fullPage: true,
  });
});

test("Review layout has one time-control zone, a compact map/AI workspace and discoverable situations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, true);
  await expect(page.locator("#history-view canvas")).toHaveAttribute(
    "data-device-colors",
    /PV-07/,
    { timeout: 25000 },
  );
  await expect(
    page.getByLabel("Khoảng thời gian đang chọn", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Chọn ngày lịch sử", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("day");
  await expect(page.locator(".history-timeline")).toHaveCount(1);
  await expect(page.locator(".history-comparison")).not.toBeVisible();
  const outer = (await page.getByTestId("history-dashboard").boundingBox())!;
  const scene = (await page.locator(".history-scene-wrap").boundingBox())!;
  expect(scene.width).toBeGreaterThan(outer.width * 0.6);
  expect(scene.width).toBeLessThan(outer.width * 0.85);
  const assistant = (await page
    .getByLabel("Trợ lý AI lịch sử", { exact: true })
    .boundingBox())!;
  expect(assistant.x).toBeGreaterThan(scene.x + scene.width);
  expect(
    await page
      .locator(".history-toolbar")
      .evaluate((el) => !!el.closest(".history-scene-panel")),
  ).toBe(true);
  expect(
    await page
      .getByRole("group", { name: "Chỉ số heatmap" })
      .evaluate((el) => !!el.closest(".history-scene-wrap")),
  ).toBe(true);
  expect(
    (await page.locator(".history-kpis").boundingBox())!.height,
  ).toBeLessThan(80);

  expect(scene.height).toBeGreaterThanOrEqual(290);
  const composer = (await page
    .getByLabel("Trợ lý AI lịch sử", { exact: true })
    .locator("form")
    .boundingBox())!;
  expect(composer.y + composer.height).toBeLessThanOrEqual(906);
  await page.screenshot({ path: "test-results/history-compact-desktop.png" });
  const situation = page
    .getByLabel("Tình huống mô phỏng trong khoảng đang chọn")
    .getByRole("button")
    .first();
  await expect(situation).toBeVisible();
  await situation.click();
  await expect(page.getByTestId("history-dashboard")).not.toHaveAttribute(
    "data-selected-asset",
    "plant",
  );
  await expect(page.locator(".history-detail")).toHaveAttribute("open", "");
});

test("Default daily mode covers the full month, keeps slider beside 3D, and historical AI has its own context", async ({
  page,
}) => {
  await page.clock.setFixedTime(now);
  const { historyModel } = await import("../src/data/history-model");
  let received: any;
  let answer = "Phân tích riêng cho lịch sử.";
  const sizes: number[] = [];
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: false } });
    received = route.request().postDataJSON();
    sizes.push(Buffer.byteLength(route.request().postData()!));
    return route.fulfill({
      json: {
        key: JSON.stringify([
          "history",
          received.context.start,
          received.context.end,
          received.context.assetId,
          historyModel.version,
        ]),
        answer,
      },
    });
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await readings(page, "2026-11-03", "2026-11-03");
  const slider = page.getByRole("slider", { name: "Chọn ngày trên timeline" });
  await expect(slider).toHaveAttribute("max", "30");
  expect(
    await slider.evaluate((el) => !!el.closest(".history-scene-panel")),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Phân tích lựa chọn này", exact: true })
    .click();
  await expect(page.getByLabel("Trợ lý AI lịch sử")).toContainText(
    "Phân tích riêng cho lịch sử.",
  );
  expect(received.context).toEqual({
    mode: "history",
    start: "2026-11-03",
    end: "2026-11-03",
    assetId: null,
  });
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("range");
  await expect(slider).toHaveCount(0);
  await readings(page, "2026-10-04", "2026-11-03");
  await page
    .getByRole("button", { name: "Phân tích lựa chọn này", exact: true })
    .click();
  await expect(page.locator(".history-chat-log article")).toHaveCount(4);
  expect(received.context.start).toBe("2026-10-04");
  expect(received.context.end).toBe("2026-11-03");
  answer = "ữ".repeat(1900);
  for (let i = 0; i < 4; i++) {
    await page
      .getByLabel("Hỏi AI lịch sử", { exact: true })
      .fill("ữ".repeat(1100));
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(page.locator(".history-chat-log article")).toHaveCount(
      6 + i * 2,
    );
  }
  expect(Math.max(...sizes)).toBeLessThan(20000);
});

test("Statistics rows keep active range and events synchronized without truncating interval events", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("tab", { name: "Thống kê", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#history-title")).toHaveCount(0);
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("day");
  const daily = page.locator(".statistics-time-controls");
  await expect(daily.getByRole("slider")).toBeVisible();
  await expect(daily.locator(".statistics-first-date")).toHaveText(
    "04/10/2026",
  );
  await expect(daily.locator(".statistics-last-date")).toHaveText("03/11/2026");
  const eventCount = (start: string, end: string) =>
    fixed.days
      .filter((d) => d.date >= start && d.date <= end)
      .reduce((n, d) => n + d.events.length, 0);
  await expect(page.locator(".history-situations button")).toHaveCount(
    eventCount("2026-11-03", "2026-11-03"),
  );
  await page
    .getByLabel("Chế độ thời gian thống kê", { exact: true })
    .selectOption("range");
  await page
    .getByRole("group", { name: "Khoảng thời gian chọn nhanh" })
    .getByRole("button", { name: "Tất cả", exact: true })
    .click();
  await expect(
    page.getByLabel("Khoảng thời gian đang chọn", { exact: true }),
  ).toHaveText("04/10/2026 – 03/11/2026");
  await expect(page.locator(".history-situations button")).toHaveCount(
    eventCount("2026-10-04", "2026-11-03"),
  );
  await range(page, "2026-10-20", "2026-10-22");
  await expect(
    page.getByLabel("Khoảng thời gian đang chọn", { exact: true }),
  ).toHaveText("20/10/2026 – 22/10/2026");
  await expect(page.locator(".history-situations button")).toHaveCount(
    eventCount("2026-10-20", "2026-10-22"),
  );
  await expect(
    page
      .getByLabel("Trợ lý AI lịch sử", { exact: true })
      .getByRole("heading", { name: "Trợ lý AI", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Trợ lý AI lịch sử", { exact: true })
      .locator(".ai-composer .ai-send svg"),
  ).toBeVisible();
  await expect(page.getByTestId("history-kpi-energy")).toContainText(
    "Sản lượng thực tế",
  );
  await page.screenshot({ path: "test-results/statistics-desktop.png" });
});

test("Time dropdown shares its row with scope and month chat uses a period/PV label without changing the viewed day", async ({
  page,
}) => {
  const { historyModel } = await import("../src/data/history-model");
  let received: any;
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: false } });
    received = route.request().postDataJSON();
    return route.fulfill({
      json: {
        key: JSON.stringify([
          "history",
          received.context.start,
          received.context.end,
          received.context.assetId,
          historyModel.version,
        ]),
        answer: "Phản hồi kiểm thử theo khoảng thời gian.",
      },
    });
  });
  await open(page);
  const mode = page.getByLabel("Chế độ thời gian thống kê", { exact: true });
  const checkControls = async () => {
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const b = document.querySelector(selector)!.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          right: b.right,
          bottom: b.bottom,
          height: b.height,
        };
      };
      return {
        mode: rect(".statistics-mode-select select"),
        scope: rect(".statistics-scope-select select"),
        box: rect(".history-compose-box"),
        input: rect(".history-compose-box textarea"),
        send: rect(".history-compose-box .ai-send"),
        time: rect(".statistics-time-controls"),
        scene: rect(".history-scene-wrap"),
        legend: rect(".history-heatmap-legend"),
        ramp: rect(".history-color-ramp"),
        notice: rect(".scene-message p"),
        viewport: innerWidth,
      };
    });
    expect(Math.abs(geometry.mode.y - geometry.scope.y)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(geometry.mode.height - geometry.scope.height),
    ).toBeLessThanOrEqual(1);
    expect(geometry.scope.x).toBeLessThan(geometry.mode.x);
    if (geometry.viewport > 1000)
      expect(geometry.time.x).toBeGreaterThan(geometry.mode.right);
    else expect(geometry.time.y).toBeGreaterThanOrEqual(geometry.mode.bottom);
    expect(geometry.legend.y).toBeGreaterThanOrEqual(geometry.scene.y);
    expect(geometry.legend.bottom).toBeLessThanOrEqual(geometry.scene.bottom);
    expect(geometry.legend.right).toBeLessThan(geometry.scene.right);
    expect(geometry.notice.right).toBeLessThan(geometry.legend.x);
    expect(geometry.ramp.height).toBeGreaterThan(100);
    expect(geometry.ramp.right - geometry.ramp.x).toBeLessThan(12);
    expect(geometry.send.x).toBeGreaterThan(geometry.input.right);
    expect(geometry.send.right).toBeLessThanOrEqual(geometry.box.right);
    expect(geometry.send.bottom).toBeLessThanOrEqual(geometry.box.bottom);
    expect(geometry.send.y).toBeGreaterThanOrEqual(geometry.box.y);
  };
  await mode.selectOption("day");
  await checkControls();
  await expect(
    page.locator(".statistics-filter-row").getByLabel("Chọn cụm pin lịch sử"),
  ).toBeVisible();
  await expect(page.locator(".history-scope")).toHaveCount(0);
  await page.getByRole("slider", { name: "Chọn ngày trên timeline" }).fill("1");
  await readings(page, "2026-10-05", "2026-10-05");
  await page
    .getByLabel("Hỏi AI lịch sử", { exact: true })
    .fill("hiệu suất của cụm pin 04 trong tháng này là như thế nào?");
  await page.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(page.locator(".history-chat-log article")).toHaveCount(2);
  expect(received.context).toEqual({
    mode: "history",
    start: "2026-11-01",
    end: "2026-11-03",
    assetId: "PV-04",
  });
  await expect(page.locator(".history-chat-log article").first()).toContainText(
    "2026-11-01 – 2026-11-03 · PV-04",
  );
  await readings(page, "2026-10-05", "2026-10-05");
  await page.screenshot({
    path: "test-results/statistics-dropdown-month-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await mode.selectOption("range");
  await expect(mode).toHaveValue("range");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-04");
  await checkControls();
  const composer = page.getByLabel("Hỏi AI lịch sử", { exact: true });
  await composer.fill("Kiểm tra giao diện");
  await composer.press("Shift+Enter");
  await expect(composer).toHaveValue("Kiểm tra giao diện\n");
  await expect(page.locator(".history-chat-log article")).toHaveCount(2);
  await composer.press("Enter");
  await expect(page.locator(".history-chat-log article")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Gửi", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/statistics-dropdown-month-mobile.png",
    fullPage: true,
  });
});
