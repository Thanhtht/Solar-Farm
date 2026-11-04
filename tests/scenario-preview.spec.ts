import { test, expect } from "@playwright/test";
test("Selecting a highlighted device shows the same scenario state in HUD and details", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-device-projections",
    /INV-01/,
  );
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "INV-01", exact: true })
    .click();
  await expect(page.locator(".hud-status")).toHaveText("Lỗi inverter");
  await expect(page.locator(".scene-hud dl")).toContainText(
    "Trạng thái inverter",
  );
  await expect(page.locator(".scene-hud dl")).toContainText("Đang lỗi");
  await expect(page.locator(".scene-hud dl")).not.toContainText("Mã lỗi");
  await expect(page.locator(".scene-hud")).toHaveClass(/critical/);
  await expect(page.locator(".scene-hud .scenario-status-note")).toContainText(
    "Dữ liệu mô phỏng theo kịch bản",
  );
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-device-outlines"))!,
        )["INV-01"],
    )
    .toBe("e44538");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-moving", "false");
  const projections = JSON.parse(
    (await canvas.getAttribute("data-device-projections"))!,
  );
  const box = await canvas.boundingBox();
  await page.mouse.move(
    box!.x + projections["INV-01"][0] * box!.width,
    box!.y + projections["INV-01"][1] * box!.height,
  );
  await expect(page.getByRole("tooltip")).toContainText("Lỗi inverter");
  await expect(page.getByRole("tooltip")).not.toContainText("Mã lỗi");
  await page.mouse.move(0, 0);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.locator(".details-status")).toHaveText("Lỗi inverter");
  await expect(page.getByRole("dialog")).toContainText(
    "Mã lỗi (0: bình thường, 1: đang lỗi)",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "kết nối IoT trong mô phỏng vẫn bình thường",
  );
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("dust");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "INV-01", exact: true })
    .click();
  await expect(page.locator(".hud-status")).toHaveText("Bám bụi · suy giảm");
  await expect(page.locator(".scene-hud dl")).toContainText("Suy giảm");
  await expect(page.locator(".scene-hud")).toHaveClass(/warning/);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".scene-hud")).toHaveCount(0);
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "INV-01", exact: true })
    .click();
  await expect(page.locator(".hud-status")).toHaveText("Bình thường");
  await expect(page.locator(".scene-hud dl")).toContainText("Bình thường");
  await expect(page.locator(".scenario-status-note")).toHaveCount(0);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-device-outlines"))!,
        )["INV-01"],
    )
    .toBe("19a86b");
});
