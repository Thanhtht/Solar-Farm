import { test, expect, type Page } from "@playwright/test";
import { createMonitoringSnapshot } from "../src/lib/monitoring";

async function openList(page: Page) {
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  return dialog;
}

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
  const opacity = async () =>
    JSON.parse((await canvas.getAttribute("data-outline-opacity"))!);
  const first = (await opacity())["INV-03"];
  await expect
    .poll(async () => Math.abs((await opacity())["INV-03"] - first), {
      intervals: [80],
    })
    .toBeGreaterThan(0.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(marker).toHaveCSS("animation-name", "none");
  await expect.poll(async () => (await opacity())["INV-03"]).toBe(1);
  const list = await openList(page);
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
  const critical = list.getByRole("button", { name: "INV-03", exact: true });
  await critical.focus();
  await critical.press("Enter");
  await expect(list).toHaveCount(0);
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
  await openList(page);
  await expect(critical).toHaveAttribute("aria-pressed", "true");
  await expect(critical).toHaveCSS("border-top-color", "rgb(228, 69, 56)");
  await page.keyboard.press("Escape");
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
  await expect(
    page.getByRole("note", { name: /Cảnh báo INV-01:/ }),
  ).toHaveCount(0);
  await expect.poll(async () => (await opacity())["INV-01"]).toBe(0.95);
  await page.getByRole("tab", { name: "Thống kê", exact: true }).click();
  await expect(page.locator(".scene-critical-marker")).toHaveCount(0);
});

async function fallback(page: Page) {
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
}

test("Popup fits the 3D frame, shows source measurements, searches and traps keyboard focus on mobile", async ({
  page,
}) => {
  await fallback(page);
  const trigger = page.getByRole("button", {
    name: "Danh sách thiết bị",
    exact: true,
  });
  expect((await trigger.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await trigger.boundingBox())!.height).toBeLessThanOrEqual(48);
  const triggerBox = (await trigger.boundingBox())!;
  const sceneBox = (await page.getByTestId("scene").boundingBox())!;
  expect(sceneBox.y - triggerBox.y - triggerBox.height).toBeGreaterThanOrEqual(
    8,
  );
  await expect(page.locator(".scene-top .device-list-trigger")).toBeVisible();
  const dialog = await openList(page);
  await expect(dialog.locator(".device-list-row")).toHaveCount(19);
  const frame = (await page.getByTestId("scene").boundingBox())!;
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(frame.x);
  expect(box.y).toBeGreaterThanOrEqual(Math.max(0, frame.y));
  expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
  expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
  const pv = createMonitoringSnapshot().assets.find((a) => a.id === "PV-01")!;
  const row = dialog.locator('[data-asset="PV-01"]');
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(100);
  expect(
    (await dialog.locator('[data-asset="INV-03"]').boundingBox())!.height,
  ).toBeLessThanOrEqual(130);
  for (const s of pv.signals)
    await expect(row.locator(`[data-signal="${s.id}"] dd`)).toContainText(
      s.value!.toLocaleString("vi-VN", { maximumFractionDigits: 2 }),
    );
  await expect(dialog).not.toContainText("IoT · Đang kết nối");
  await expect(row).toContainText("Khu A");
  await expect(dialog.locator(".device-row-details")).toHaveCount(19);
  await row
    .getByRole("button", { name: "Xem chi tiết PV-01", exact: true })
    .click();
  const profile = page.locator("dialog.device-dialog");
  await expect(dialog).toHaveCount(0);
  await expect(profile).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(profile.locator("h2")).toHaveText("Cụm pin 01");
  await expect(profile.locator(".details-identity")).toContainText("PV-01");
  await expect(
    profile.getByRole("button", { name: "Đóng hồ sơ thiết bị" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(profile).toHaveCount(0);
  await openList(page);
  await expect(
    dialog.getByRole("button", { name: "Đóng danh sách thiết bị" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("searchbox", { name: "Tìm thiết bị" }),
  ).toBeFocused();
  await dialog.getByLabel("Lọc trạng thái thiết bị").selectOption("critical");
  await expect(dialog.locator(".device-list-row")).toHaveCount(1);
  await expect(dialog.locator(".device-list-row")).toContainText("INV-03");
  await page
    .locator(".scene-panel")
    .screenshot({ path: "test-results/device-list-popup-desktop.png" });
  await dialog.getByLabel("Lọc trạng thái thiết bị").selectOption("all");
  await dialog.screenshot({
    path: "test-results/device-list-compact-desktop.png",
  });
  await dialog.getByRole("searchbox", { name: "Tìm thiết bị" }).fill("khu b");
  await expect(dialog.locator(".device-list-row")).toHaveCount(8);
  await dialog
    .getByRole("searchbox", { name: "Tìm thiết bị" })
    .fill("không tồn tại");
  await expect(dialog).toContainText("Không tìm thấy thiết bị phù hợp");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Mở danh sách thiết bị" }).click();
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 48; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  const mobile = (await dialog.boundingBox())!;
  expect(mobile.x + mobile.width).toBeLessThanOrEqual(390);
  expect(mobile.y + mobile.height).toBeLessThanOrEqual(844);
  expect(
    (await dialog.locator('[data-asset="PV-01"]').boundingBox())!.height,
  ).toBeLessThanOrEqual(174);
  await dialog
    .locator(".device-list-scroll")
    .evaluate((el) => (el.scrollTop = 0));
  await dialog.screenshot({
    path: "test-results/device-list-popup-mobile.png",
  });
  await dialog
    .getByRole("button", { name: "Xem chi tiết GW-01", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(profile).toBeVisible();
  await expect(profile.locator(".details-identity")).toContainText("GW-01");
  await profile.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await expect(page.locator(".hud-identity")).toContainText("GW-01");
});

test("Status borders work without WebGL and update with scenario, reset and tab isolation", async ({
  page,
}) => {
  await fallback(page);
  const check = async (state: string) => {
    const dialog = await openList(page);
    await expect(
      dialog.getByRole("button", { name: "INV-01", exact: true }),
    ).toHaveAttribute("data-status", state);
    await page.keyboard.press("Escape");
  };
  await check("normal");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await check("critical");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await check("normal");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await check("critical");
  await page.locator(".simulation-reset").click();
  await check("normal");
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  const dialog = await openList(page);
  await expect(
    dialog.getByRole("button", { name: "INV-01", exact: true }),
  ).toHaveAttribute("data-status", "warning");
  await dialog.getByRole("button", { name: "INV-01", exact: true }).click();
  await expect(page.locator(".hud-identity")).toContainText("INV-01");
});
