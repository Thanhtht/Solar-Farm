import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { PNG } from "pngjs";
function imageDifference(a: Buffer, b: Buffer) {
  const left = PNG.sync.read(a),
    right = PNG.sync.read(b);
  expect([right.width, right.height]).toEqual([left.width, left.height]);
  let changed = 0;
  for (let i = 0; i < left.data.length; i += 4) {
    if (
      [0, 1, 2].some((c) => Math.abs(left.data[i + c] - right.data[i + c]) > 25)
    )
      changed++;
  }
  return changed / (left.width * left.height);
}
test("WebGL, camera, thiết bị, cấu hình và responsive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Solar Farm One" }),
  ).toBeVisible();
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect(page.getByText("Đang chuẩn bị nhà máy 3D…")).toHaveCount(0);
  await expect(page.locator(".scene-label")).toContainText("INV-01");
  const rect = await canvas.boundingBox();
  if (!rect) throw Error("No canvas");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "test-results/overview-1440.png",
    fullPage: true,
  });
  const original = await canvas.screenshot();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.55,
    { steps: 15 },
  );
  await page.mouse.up();
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(original)).toBe(false);
  const rotated = await canvas.screenshot();
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.waitForTimeout(1000);
  writeFileSync("test-results/camera-original.png", original);
  const resetImage = await canvas.screenshot();
  writeFileSync("test-results/camera-reset.png", resetImage);
  expect(imageDifference(original, resetImage)).toBeLessThan(0.02);
  // Click scene geometry at several interior points until another fixture asset is picked.
  for (const [x, y] of [
    [0.4, 0.5],
    [0.6, 0.5],
    [0.35, 0.6],
    [0.5, 0.6],
    [0.55, 0.45],
    [0.45, 0.4],
  ]) {
    await canvas.click({ position: { x: rect.width * x, y: rect.height * y } });
    if (!(await page.locator(".device-id").innerText()).includes("INV-01"))
      break;
  }
  await expect(page.locator(".device-id")).not.toContainText("INV-01");
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  for (const [id, name] of [
    ["PV-02", "Cụm pin 02"],
    ["INV-03", "Inverter 03"],
    ["TR-01", "Trạm thu gom"],
    ["MET-01", "Trạm thời tiết"],
    ["GW-01", "Gateway trung tâm"],
  ]) {
    await page
      .locator(".device-buttons")
      .getByRole("button", { name: id, exact: true })
      .click();
    await expect(page.locator(".detail-panel h2")).toHaveText(name);
    await expect(page.locator(".device-id")).toContainText(id);
    await expect(page.locator(".signal").first()).toBeVisible();
    await expect(page.locator(".signal-list small")).toHaveCount(0);
    await expect(
      page.locator(".signal").first().locator("span span"),
    ).not.toHaveText("");
    if (id.startsWith("PV-")) {
      await expect(
        page.locator(".signal").first().getByText("Nhiệt độ", { exact: true }),
      ).toBeVisible();
      await expect(page.locator(".signal-list small")).toHaveCount(0);
      await expect(
        page.locator(".signal").filter({ hasText: "Dòng DC" }),
      ).not.toContainText("tương đương");
      await expect(
        page.locator(".signal").filter({ hasText: "Công suất DC" }),
      ).not.toContainText("tính toán");
    }
    await expect(page.locator(".scene-label")).toContainText(id);
  }
  await page.locator(".notice-panel button").click();
  await expect(page.locator(".device-id")).toContainText("GW-01");
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await expect(
    page.getByRole("heading", { name: "Khám phá từng thiết bị" }),
  ).toBeVisible();
  await expect(page.locator(".scenario-card")).toHaveCount(3);
  await page.locator(".scenario-card").filter({ hasText: "Mây che" }).click();
  await expect(page.locator(".preview-label")).toContainText("Mây che");
  await page.getByRole("button", { name: "Tự cấu hình", exact: true }).click();
  await page.getByLabel("Loại tình huống").selectOption("dust");
  await page.getByLabel("Cụm chịu ảnh hưởng").selectOption("INV-04");
  await page.getByLabel("Mức độ minh họa").fill("35");
  await expect(page.locator(".config-panel")).toContainText("35%");
  await page.getByLabel("Thời lượng dự kiến").fill("90");
  await expect(page.locator(".config-panel")).toContainText("90 phút");
  await expect(
    page.getByRole("button", { name: "Chạy mô phỏng · có ở T02" }),
  ).toBeDisabled();
  await page.getByLabel("Loại tình huống").selectOption("fault");
  await expect(page.getByLabel("Mức độ minh họa")).toHaveCount(0);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByLabel("Loại tình huống")).toBeVisible();
    if (width === 390) {
      const scene = await page.locator(".scene-panel").boundingBox();
      const config = await page.locator(".config-panel").boundingBox();
      expect(config!.y - (scene!.y + scene!.height)).toBeLessThan(25);
    }
    await page.screenshot({
      path: `test-results/dashboard-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Đặt lại cấu hình" }).click();
  await expect(page.locator(".preview-label")).toHaveCount(0);
  await expect(page.locator(".device-id")).toContainText("INV-01");
  expect(errors).toEqual([]);
});
test("WebGL không khả dụng: thông báo và danh sách thay thế", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
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
  await expect(page.locator(".detail-panel h2")).toHaveText("Trạm thời tiết");
});

// Check the actual first viewport: the complete 3D frame must fit without scrolling.
test("Logo SAVA và khung 3D nằm trọn màn hình desktop", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("img", { name: "SAVA — GOOD TO GREAT" });
  await expect(logo).toHaveAttribute("src", "/brand/sava-logo.png");
  const originalLogo = await page.request.get("/brand/sava-logo.png");
  expect(originalLogo.ok()).toBe(true);
  const { createHash } = await import("node:crypto");
  expect(
    createHash("sha256")
      .update(await originalLogo.body())
      .digest("hex"),
  ).toBe("3968915299647fcba2a0e7c2c8c23f8cc538b182f50dd227e3eebee107d94292");
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    ),
  ).toBe(true);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const frame = await page.locator(".scene-panel").boundingBox();
    expect(frame!.y).toBeLessThan(300);
    expect(frame!.y + frame!.height).toBeLessThanOrEqual(viewport.height);
    const inspector = await page.locator(".detail-panel").boundingBox();
    expect(Math.abs(inspector!.height - frame!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(inspector!.y - frame!.y)).toBeLessThanOrEqual(1);
    expect(
      await page
        .locator(".device-content")
        .evaluate((el) => getComputedStyle(el).overflowY),
    ).toBe("auto");
    // Relations must stay reachable when a short laptop viewport requires internal scrolling.
    await page.locator(".relations button").first().scrollIntoViewIfNeeded();
    await expect(page.locator(".relations button").first()).toBeVisible();
    const canvas = await page.locator("canvas").boundingBox();
    expect(canvas!.height).toBeGreaterThan(300);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/first-screen-${viewport.width}.png`,
    });
  }
});
