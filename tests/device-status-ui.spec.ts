import { test, expect } from "@playwright/test";

test("Device list and persistent scene warnings follow the same state without hiding selection", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-device-projections", /INV-03/, {
    timeout: 20000,
  });
  const marker = page.getByRole("note", { name: /Cảnh báo INV-03:/ });
  await expect(marker).toBeVisible();
  await expect(marker).toContainText("Dừng phát điện");
  await expect(page.locator(".scene-critical-marker")).toHaveCount(1);
  const opacity = async () =>
    JSON.parse((await canvas.getAttribute("data-outline-opacity"))!);
  const first = (await opacity())["INV-03"];
  await expect
    .poll(async () => Math.abs((await opacity())["INV-03"] - first), {
      intervals: [80],
    })
    .toBeGreaterThan(0.1);
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  const list = page.locator(".device-tree");
  for (const [id, state, color, label] of [
    ["PV-01", "normal", "rgb(25, 168, 107)", "Bình thường"],
    ["PV-06", "warning", "rgb(233, 179, 35)", "Lưu ý"],
    ["INV-06", "warning", "rgb(233, 179, 35)", "Lưu ý"],
    ["GW-01", "warning", "rgb(233, 179, 35)", "Lưu ý"],
    ["INV-03", "critical", "rgb(228, 69, 56)", "Cảnh báo"],
  ]) {
    const button = list.getByRole("button", { name: id, exact: true });
    await expect(button).toHaveAttribute("data-status", state);
    await expect(button).toHaveCSS("border-top-color", color);
    await expect(button).toHaveAccessibleDescription(new RegExp(label));
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(marker).toHaveCSS("animation-name", "none");
  await expect.poll(async () => (await opacity())["INV-03"]).toBe(1);
  const critical = list.getByRole("button", { name: "INV-03", exact: true });
  await critical.focus();
  await critical.press("Enter");
  await expect(critical).toHaveAttribute("aria-pressed", "true");
  await expect(critical).toHaveCSS("border-top-color", "rgb(228, 69, 56)");
  await expect(page.locator(".scene-hud")).toHaveClass(/critical/);
  await expect(marker.locator(".selection-marker")).toHaveText(
    "Đang chọn · INV-03",
  );
  await page
    .getByRole("button", { name: "Góc nhìn tổng quan", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-camera-moving", "false");
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/device-critical-scene.png" });
  await list.screenshot({ path: "test-results/device-status-list.png" });
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(
    page.getByRole("note", { name: /Cảnh báo INV-01:/ }),
  ).toBeVisible();
  await page.locator(".simulation-reset").click();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await expect(
    page.getByRole("note", { name: /Cảnh báo INV-01:/ }),
  ).toHaveCount(0);
  await expect.poll(async () => (await opacity())["INV-01"]).toBe(0.95);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await list.screenshot({ path: "test-results/device-status-list-mobile.png" });
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await expect(page.locator(".scene-critical-marker")).toHaveCount(0);
});

test("Status borders work without WebGL and update with scenario, reset and tab isolation", async ({
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
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  const firstInverter = page
    .locator(".device-tree")
    .getByRole("button", { name: "INV-01", exact: true });
  await expect(firstInverter).toHaveAttribute("data-status", "normal");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(firstInverter).toHaveAttribute("data-status", "critical");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(firstInverter).toHaveAttribute("data-status", "normal");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(firstInverter).toHaveAttribute("data-status", "critical");
  await page.locator(".simulation-reset").click();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await expect(firstInverter).toHaveAttribute("data-status", "normal");
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(firstInverter).toHaveAttribute("data-status", "warning");
  await firstInverter.click();
  await expect(page.locator(".hud-identity")).toContainText("INV-01");
});
