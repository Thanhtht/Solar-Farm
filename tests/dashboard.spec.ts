import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { createHash } from "node:crypto";
function difference(a: Buffer, b: Buffer) {
  const x = PNG.sync.read(a),
    y = PNG.sync.read(b);
  expect([x.width, x.height]).toEqual([y.width, y.height]);
  let changed = 0;
  for (let i = 0; i < x.data.length; i += 4)
    if ([0, 1, 2].some((c) => Math.abs(x.data[i + c] - y.data[i + c]) > 25))
      changed++;
  return changed / (x.width * x.height);
}
async function open(page: Page) {
  await page.goto("/");
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await expect(page.locator(".scene-label")).toContainText("INV-01", {
    timeout: 20000,
  });
  await expect(page.getByText("Đang chuẩn bị nhà máy 3D…")).toHaveCount(0, {
    timeout: 20000,
  });
}
async function waitFocus(page: Page, previous: string | null, id: string) {
  const canvas = page.locator("canvas");
  await expect
    .poll(() => canvas.getAttribute("data-focus-request"))
    .not.toBe(previous);
  await expect(canvas).toHaveAttribute("data-focus-target", id);
  await expect(canvas).toHaveAttribute("data-camera-moving", "false", {
    timeout: 15000,
  });
}
async function select(page: Page, id: string) {
  const toggle = page.getByRole("button", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  if ((await toggle.getAttribute("aria-expanded")) !== "true")
    await toggle.click();
  const old = await page.locator("canvas").getAttribute("data-focus-request");
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: id, exact: true })
    .click();
  await waitFocus(page, old, id);
  await page.locator(".scene-panel").scrollIntoViewIfNeeded();
  await expect(page.locator(".hud-identity")).toContainText(id);
}

test("Camera xoay/zoom/reset và tự focus khi chọn thiết bị", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  const canvas = page.locator("canvas");
  await page.getByRole("button", { name: "Ẩn hồ sơ thiết bị" }).click();
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  const rect = await canvas.boundingBox();
  if (!rect) throw Error("No canvas");
  await page.waitForTimeout(600);
  const original = await canvas.screenshot();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.55,
    { steps: 10 },
  );
  await page.mouse.up();
  await page.waitForTimeout(900);
  const rotated = await canvas.screenshot();
  expect(rotated.equals(original)).toBe(false);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.waitForTimeout(900);
  const reset = await canvas.screenshot();
  writeFileSync("test-results/camera-reset.png", reset);
  expect(difference(original, reset)).toBeLessThan(0.02);
  const initial = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  await select(page, "PV-02");
  const focused = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  const distance = (p: number[]) => Math.hypot(p[0] + 6, p[1], p[2] + 8.5);
  expect(distance(focused)).toBeLessThan(distance(initial) * 0.8);
  expect(distance(focused)).toBeLessThan(44);
  await expect(page.locator(".scene-hud")).toBeVisible();
  await expect(page.locator(".scene-hud svg.trend")).toHaveCount(0);
  await page.getByRole("button", { name: "Ẩn hồ sơ thiết bị" }).click();
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  await page.getByRole("button", { name: "Hiện hồ sơ" }).click();
  await expect(page.locator(".scene-hud h2")).toHaveText("Cụm pin 02");
  await page.screenshot({ path: "test-results/hud-focus.png" });
});

test("HUD ngắn gọn, popup chi tiết, bàn phím và khu vực AI", async ({
  page,
}) => {
  await open(page);
  await select(page, "PV-06");
  const hud = page.locator(".scene-hud");
  await expect(hud).toHaveClass(/warning/);
  await expect(hud).toContainText("Nhiệt độ");
  await expect(hud).toContainText("58");
  await expect(hud).toContainText("Lưu ý");
  await expect(hud.locator("dl>div").first()).toHaveClass(
    /hud-attention warning/,
  );
  await expect(hud.locator(".hud-attention dd")).toContainText("58");
  await expect(page.locator(".scene-label-reading.warning")).toContainText(
    "58",
  );
  await expect(page.locator(".scene-label-reading.warning")).toContainText(
    "°C",
  );
  await expect(hud.locator("dl>div")).toHaveCount(4);
  await expect(hud.locator(".relations")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText("Cụm pin 06");
  await expect(dialog.getByRole("img", { name: /Nhiệt độ/ })).toBeVisible();
  await expect(dialog.locator(".signal-list small")).toHaveCount(0);
  const canvasBox = await page.locator("canvas").boundingBox(),
    box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(canvasBox!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    canvasBox!.x + canvasBox!.width,
  );
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await dialog
    .locator(".relations")
    .getByRole("button", { name: "INV-06", exact: true })
    .click();
  await expect(dialog.locator("h2")).toHaveText("Inverter 06");
  await page.screenshot({ path: "test-results/device-dialog.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xem chi tiết", exact: true }),
  ).toBeFocused();
  const ai = page.getByRole("region", { name: "Trợ lý AI" });
  await expect(ai).toContainText("INV-06");
  await expect(ai).toContainText("Chưa kết nối");
  await expect(ai.locator("textarea")).toBeDisabled();
  await expect(ai.getByRole("button", { name: "Gửi câu hỏi" })).toBeDisabled();
  await expect(ai.locator(".device-summary")).toHaveCount(0);
  await select(page, "INV-03");
  await expect(hud).toHaveClass(/critical/);
  await expect(hud).toContainText("78");
  await expect(hud).toContainText("Cảnh báo");
  await expect(hud.locator("dl>div").first()).toHaveClass(
    /hud-attention critical/,
  );
  await expect(hud.locator(".hud-attention dd")).toContainText("78");
  await expect(page.locator(".scene-label-reading.critical")).toContainText(
    "78",
  );
  await page.screenshot({ path: "test-results/critical-hud.png" });
});

test("GLB tải một lần, click 5 loại, cảnh báo và vật liệu độc lập", async ({
  page,
}) => {
  test.setTimeout(90000);
  const loaded = new Set<string>(),
    requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".glb")) requests.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().endsWith(".glb") && r.ok()) loaded.add(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect.poll(() => loaded.size).toBe(16);
  expect(requests.length).toBe(16);
  const canvas = page.locator("canvas");
  await expect
    .poll(() => canvas.getAttribute("data-device-projections"))
    .not.toBeNull();
  const original = JSON.parse(
    (await canvas.getAttribute("data-camera-position"))!,
  );
  for (const id of ["PV-02", "INV-03", "TR-01", "MET-01", "GW-01"]) {
    await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
    await expect
      .poll(async () => {
        const p = JSON.parse(
          (await canvas.getAttribute("data-camera-position"))!,
        );
        return Math.hypot(...p.map((n: number, i: number) => n - original[i]));
      })
      .toBeLessThan(0.1);
    const positions = JSON.parse(
        (await canvas.getAttribute("data-device-projections"))!,
      ),
      rect = await canvas.boundingBox();
    if (!rect) throw Error("Canvas");
    const old = await canvas.getAttribute("data-focus-request");
    // Use the real projected model position, including any HTML label above it.
    await page.mouse.click(
      rect.x + positions[id][0] * rect.width,
      rect.y + positions[id][1] * rect.height,
    );
    await waitFocus(page, old, id);
    await expect(page.locator(".hud-identity")).toContainText(id);
  }
  await expect(page.locator(".device-alert")).toHaveCount(0);
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-rings"))!),
    )
    .toMatchObject({ "INV-03": "e44538", "PV-06": "e9b323" });
  const base = JSON.parse((await canvas.getAttribute("data-device-colors"))!);
  expect(base["INV-03"]).toBe(base["INV-02"]);
  expect(base["PV-06"]).toBe(base["PV-05"]);
  await select(page, "PV-02");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "PV-03");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "INV-03");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await select(page, "PV-06");
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-rings"))!),
    )
    .toEqual({ "INV-03": "e44538", "PV-06": "e9b323" });
  await page.getByRole("button", { name: /Bám bụi/ }).click();
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-rings"))!),
    )
    .toMatchObject({ "PV-01": "e9b323", "INV-01": "e9b323" });
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  await page.getByRole("button", { name: /Lỗi inverter/ }).click();
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-device-rings"))!),
    )
    .toMatchObject({ "PV-01": "e44538", "INV-01": "e44538" });
  expect(
    JSON.parse((await canvas.getAttribute("data-device-colors"))!),
  ).toEqual(base);
  expect(errors).toEqual([]);
});

test("Bố cục desktop/mobile, logo gốc và cấu hình", async ({ page }) => {
  await open(page);
  const logo = page.getByRole("img", { name: "SAVA — GOOD TO GREAT" });
  await expect(logo).toHaveAttribute("src", "/brand/sava-logo.png");
  const original = await page.request.get("/brand/sava-logo.png");
  expect(
    createHash("sha256")
      .update(await original.body())
      .digest("hex"),
  ).toBe("3968915299647fcba2a0e7c2c8c23f8cc538b182f50dd227e3eebee107d94292");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect
      .poll(async () => {
        const b = await page.locator(".scene-panel").boundingBox();
        return b!.y + b!.height;
      })
      .toBeLessThanOrEqual(viewport.height);
    const frame = await page.locator(".scene-panel").boundingBox(),
      ai = await page.locator(".ai-panel").boundingBox();
    expect(Math.abs(ai!.height - frame!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(ai!.y - frame!.y)).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: `test-results/overview-${viewport.width}.png`,
    });
  }
  await page.getByRole("button", { name: "Tự cấu hình", exact: true }).click();
  await page.getByLabel("Loại tình huống").selectOption("dust");
  await page.getByLabel("Mức độ minh họa").fill("35");
  await page.getByLabel("Cụm chịu ảnh hưởng").selectOption("INV-04");
  await expect(page.locator(".config-panel")).toContainText("35%");
  await page.getByLabel("Loại tình huống").selectOption("fault");
  await expect(page.getByLabel("Mức độ minh họa")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 1100 });
  await select(page, "INV-03");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const hud = await page.locator(".scene-hud").boundingBox(),
    canvas = await page.locator("canvas").boundingBox();
  expect(hud!.x).toBeGreaterThanOrEqual(canvas!.x);
  expect(hud!.x + hud!.width).toBeLessThanOrEqual(canvas!.x + canvas!.width);
  await page.screenshot({
    path: "test-results/mobile-hud.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Đặt lại cấu hình" }).click();
  await expect(page.locator(".preview-label")).toHaveCount(0);
  await expect(page.locator(".hud-identity")).toContainText("INV-01");
});

test("WebGL không khả dụng vẫn chọn được thiết bị và xem popup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...(args as []));
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByText("WebGL chưa khả dụng", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "MET-01", exact: true })
    .click();
  await expect(page.locator(".hud-identity")).toContainText("MET-01");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.getByRole("dialog").locator("h2")).toHaveText(
    "Trạm thời tiết",
  );
});

test("Model tải lỗi có thể thử lại", async ({ page }) => {
  let failed = false;
  await page.route("**/inverter/inverter.glb", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 503, body: "Temporary error" });
    } else await route.continue();
  });
  await page.goto("/");
  await expect(
    page.getByText("Không thể tải cảnh 3D", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Thử lại cảnh 3D" }).click();
  await expect(page.locator(".scene-label")).toContainText("INV-01", {
    timeout: 20000,
  });
});
