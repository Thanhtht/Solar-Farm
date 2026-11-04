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
  await page.getByRole("tab", { name: "Hiệu suất", exact: true }).click();
  await expect(page.getByTestId("history-dashboard")).toHaveAttribute(
    "data-today",
    "2026-11-04",
  );
}
async function range(page: Page, start: string, end = start) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
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
  const daySlider = page.getByRole("slider", {
    name: "Chọn ngày trên timeline",
  });
  await daySlider.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await readings(page, "2026-10-21", "2026-10-21", "PV-03");
  await page.getByRole("button", { name: "Ngày sau", exact: true }).click();
  await readings(page, "2026-10-22", "2026-10-22", "PV-03");
  await page.getByRole("button", { name: "Toàn khoảng", exact: true }).click();
  await readings(page, "2026-10-16", "2026-10-22", "PV-03");
  await page.getByRole("button", { name: /^Xem ngày 2026-10-20:/ }).focus();
  await page.keyboard.press("Enter");
  await readings(page, "2026-10-20", "2026-10-20", "PV-03");
  const slider = page.getByRole("slider", { name: "Chọn ngày trên timeline" });
  await slider.focus();
  await page.keyboard.press("Home");
  await readings(page, "2026-10-16", "2026-10-16", "PV-03");
});

test("Custom input rejects today, future, outside history and reversed dates without changing results", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
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
  await page.getByRole("tab", { name: "Hiệu suất", exact: true }).click();
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
  await expect(page.locator(".history-scope")).toContainText("100,0%");
  await page.getByLabel("Chọn cụm pin lịch sử").selectOption("PV-08");
  await range(page, "2026-10-25");
  await readings(page, "2026-10-25", "2026-10-25", "PV-08");
  await expect(page.locator(".history-scope")).toContainText("75,0%");
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
    "Không có dữ liệu hợp lệ cả ngày",
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
  await page.getByRole("tab", { name: "Hiệu suất", exact: true }).click();
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
    page.getByRole("tab", { name: "Hiệu suất", exact: true }),
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
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
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
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
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

test("Review layout has one time-control zone, a full-width map and discoverable situations", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('.history-toolbar input[type="date"]')).toHaveCount(
    0,
  );
  await expect(
    page.getByLabel("Chọn ngày lịch sử", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".history-timeline")).toHaveCount(1);
  await expect(page.locator(".history-comparison")).not.toBeVisible();
  const outer = (await page.getByTestId("history-dashboard").boundingBox())!;
  const scene = (await page.locator(".history-scene-wrap").boundingBox())!;
  expect(scene.width).toBeGreaterThan(outer.width * 0.94);
  expect(scene.height).toBeGreaterThanOrEqual(470);
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
