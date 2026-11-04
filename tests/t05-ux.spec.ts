import { test, expect, type Page } from "@playwright/test";
import { contextKey } from "../src/lib/analysis";

async function fallback(page: Page) {
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

test("Mention keyboard focus stays in the composer and dismisses when leaving it", async ({
  page,
}) => {
  await fallback(page);
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    return route.fulfill({
      json: { key: contextKey(body.context), answer: "Analyse fixture T05." },
    });
  });
  await page.goto("/");
  await expect(page.locator(".ai-message.assistant")).toHaveCount(1);
  const input = page.getByRole("textbox", { name: "Nhập câu hỏi cho AI" });
  const list = page.getByRole("listbox", { name: "Gợi ý thiết bị" });
  await input.fill("@");
  await input.press("End");
  await expect(list).toBeVisible();
  await input.press("Shift+Tab");
  // Chromium can also put the scrollable conversation in the Tab order.
  // The regression is entering an option, not the exact previous control.
  expect(
    await page.evaluate(() => ({
      inComposer: Boolean(document.activeElement?.closest(".ai-composer")),
      onBody: document.activeElement === document.body,
    })),
  ).toEqual({ inComposer: false, onBody: false });
  await expect(list).toHaveCount(0);
  await input.focus();
  await input.fill("@INV-");
  await input.press("End");
  await input.press("ArrowUp");
  await input.press("Tab");
  await expect(input).toBeFocused();
  await expect(page.locator(".ai-mention")).toContainText("INV-08");
  await expect(list).toHaveCount(0);
});

test("Capability failure can be retried without reload or changing simulation", async ({
  page,
}) => {
  await fallback(page);
  let probes = 0;
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET") {
      probes++;
      return probes === 1
        ? route.fulfill({ status: 503, json: { error: "Unavailable" } })
        : route.fulfill({
            json: { available: true, credentialStatus: "ready" },
          });
    }
    const body = route.request().postDataJSON();
    return route.fulfill({
      json: { key: contextKey(body.context), answer: "Phản hồi fixture T05." },
    });
  });
  await page.goto("/");
  await expect(
    page.getByText("Chưa kiểm tra được kết nối Gemini.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("4");
  await page.getByRole("button", { name: "Thử lại kết nối AI" }).click();
  const input = page.getByRole("textbox");
  await expect(input).toBeEnabled();
  await expect(
    page.getByLabel("Quy mô ảnh hưởng", { exact: true }),
  ).toHaveValue("4");
  await input.fill("Kiểm tra lại kết nối");
  await input.press("Enter");
  await expect(page.locator(".ai-message.assistant")).toContainText(
    "Phản hồi fixture T05.",
  );
  expect(probes).toBe(2);
});

test("A stalled capability probe times out and only retries on request", async ({
  page,
}) => {
  await fallback(page);
  await page.clock.install();
  let probes = 0;
  await page.route("**/api/ai", (route) => {
    probes++;
    if (probes > 1) return route.fulfill({ json: { available: true } });
    // Keep the first response pending to exercise the browser timeout.
  });
  await page.goto("/");
  await expect.poll(() => probes).toBe(1);
  await page.clock.fastForward(10001);
  const retry = page.getByRole("button", { name: "Thử lại kết nối AI" });
  await expect(retry).toBeVisible();
  await page.clock.fastForward(30000);
  expect(probes).toBe(1);
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await retry.click();
  await expect(page.getByRole("textbox")).toBeEnabled();
  expect(probes).toBe(2);
});

test("Portrait, landscape and short viewports keep popup, send and modal controls usable", async ({
  page,
}) => {
  await fallback(page);
  await page.route("**/api/ai", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true } });
    const body = route.request().postDataJSON();
    return route.fulfill({
      json: { key: contextKey(body.context), answer: "Analyse fixture T05." },
    });
  });
  await page.goto("/");
  await expect(page.locator(".ai-message.assistant")).toHaveCount(1);
  const input = page.getByRole("textbox");
  // Measure popup scrolling independently of the browser's smooth focus scroll.
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }",
  });
  const list = page.getByRole("listbox");
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [844, 390],
    [390, 400],
    [1024, 400],
  ]) {
    await page.setViewportSize({ width, height });
    await input.fill("");
    await input.fill("@");
    await input.press("End");
    await input.scrollIntoViewIfNeeded();
    await expect(list).toBeVisible();
    await input.press("ArrowUp");
    await expect(list.getByRole("option").last()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Active option is visible within the popup, without scrolling the page.
    const before = await page.evaluate(() => scrollY);
    await input.press("ArrowDown");
    await expect(list.getByRole("option").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await input.press("Escape");
    await input.fill("Bản nháp T05");
    await input.press("Tab");
    await expect(
      page.getByRole("button", { name: "Gửi câu hỏi" }),
    ).toBeFocused();
    const card = page
      .locator(".kpis")
      .getByRole("button", { name: /Công suất AC/ });
    await card.click();
    const dialog = page.getByRole("dialog");
    const close = dialog.getByRole("button", { name: "Đóng chi tiết chỉ số" });
    await close.focus();
    for (let i = 0; i < 8; i++)
      await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    const bounds = await dialog.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
    await page.keyboard.press("Escape");
    await expect(card).toBeFocused();
    await expect(input).toHaveValue("Bản nháp T05");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test.describe("Chromium touch emulation", () => {
  test.use({
    hasTouch: true,
    viewport: { width: 768, height: 1024 },
    reducedMotion: "reduce",
  });
  test("One finger rotates, two fingers pan and pinch, tap selects and reset restores overview", async ({
    page,
    context,
  }) => {
    test.setTimeout(90000);
    await page.goto("/");
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-device-projections", /PV-02/, {
      timeout: 20000,
    });
    await expect(page.getByText("Đang chuẩn bị nhà máy 3D…")).toHaveCount(0, {
      timeout: 20000,
    });
    await canvas.scrollIntoViewIfNeeded();
    const camera = () =>
      canvas.evaluate((el) => ({
        position: JSON.parse(el.getAttribute("data-camera-position")!),
        target: JSON.parse(el.getAttribute("data-camera-target")!),
      }));
    const initial = await camera();
    const cdp = await context.newCDPSession(page);
    const bounds = (await canvas.boundingBox())!;
    const x = bounds.x + bounds.width / 2,
      y = bounds.y + bounds.height / 2;
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      points: { x: number; y: number; id: number }[],
    ) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    await touch("touchStart", [{ x, y, id: 1 }]);
    await touch("touchMove", [{ x: x + 55, y: y + 20, id: 1 }]);
    await touch("touchEnd", []);
    await expect
      .poll(async () =>
        Math.hypot(
          ...(await camera()).position.map(
            (n: number, i: number) => n - initial.position[i],
          ),
        ),
      )
      .toBeGreaterThan(1);
    await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
    await expect
      .poll(async () => (await camera()).target)
      .toEqual(initial.target);
    await canvas.scrollIntoViewIfNeeded();
    const distance = (state: { position: number[]; target: number[] }) =>
      Math.hypot(...state.position.map((n, i) => n - state.target[i]));
    await touch("touchStart", [
      { x: x - 35, y, id: 1 },
      { x: x + 35, y, id: 2 },
    ]);
    await touch("touchMove", [
      { x: x - 50, y: y + 35, id: 1 },
      { x: x + 80, y: y + 35, id: 2 },
    ]);
    await touch("touchEnd", []);
    await expect
      .poll(async () => distance(await camera()))
      .toBeLessThan(distance(initial) * 0.9);
    await expect
      .poll(async () =>
        Math.hypot(
          ...(await camera()).target.map(
            (n: number, i: number) => n - initial.target[i],
          ),
        ),
      )
      .toBeGreaterThan(0.5);
    await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
    await expect
      .poll(async () => Math.abs(distance(await camera()) - distance(initial)))
      .toBeLessThan(0.1);
    await canvas.scrollIntoViewIfNeeded();
    const positions = JSON.parse(
      (await canvas.getAttribute("data-device-projections"))!,
    );
    const rect = (await canvas.boundingBox())!;
    await page.touchscreen.tap(
      rect.x + positions["PV-02"][0] * rect.width,
      rect.y + positions["PV-02"][1] * rect.height,
    );
    await expect(page.locator(".hud-identity")).toContainText("PV-02");
    await expect(canvas).toHaveAttribute("data-camera-moving", "false");
    await page
      .getByRole("button", { name: "Xem chi tiết", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.screenshot({ path: "test-results/t05-tablet-touch.png" });
  });
});
