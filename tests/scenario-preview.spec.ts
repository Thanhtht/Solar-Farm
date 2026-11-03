import { test, expect } from "@playwright/test";
import { createRun } from "../src/lib/simulation";
import { scenarioAssets, assetStatus } from "../src/lib/scenario-preview";

test("Scenario status is derived consistently without overwriting baseline telemetry", () => {
  const initial = createRun();
  const before = JSON.stringify(initial);
  const fault = scenarioAssets(initial.assets, "fault", "INV-01", 100);
  for (const id of ["INV-01", "PV-01"]) {
    const asset = fault.find((a) => a.id === id)!;
    expect(assetStatus(asset).level).toBe("critical");
    expect(assetStatus(asset).label).toContain("xem thử");
    expect(asset.operation).toBe("Bình thường");
    expect(asset.connection).toBe("Đang kết nối");
    expect(asset.signals).toEqual(
      initial.assets.find((a) => a.id === id)!.signals,
    );
  }
  const dust = scenarioAssets(initial.assets, "dust", "INV-01", 20);
  expect(assetStatus(dust.find((a) => a.id === "INV-01")!).level).toBe(
    "warning",
  );
  expect(
    scenarioAssets(initial.assets, "dust", "INV-01", 0).some((a) => a.preview),
  ).toBe(false);
  expect(
    scenarioAssets(initial.assets, "cloud", "INV-01", 45)
      .filter((a) => a.preview)
      .map((a) => a.id),
  ).toEqual(["PV-01", "PV-02", "PV-05", "PV-06"]);
  const thermal = scenarioAssets(initial.assets, "dust", "INV-03", 20).find(
    (a) => a.id === "INV-03",
  )!;
  expect(assetStatus(thermal).level).toBe("critical");
  expect(assetStatus(thermal).reason).toContain("Nhiệt độ");
  expect(scenarioAssets(fault, null, "INV-01", 0).some((a) => a.preview)).toBe(
    false,
  );
  expect(JSON.stringify(initial)).toBe(before);
});

test("Selecting a highlighted device shows the same scenario state in HUD and details", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-device-projections",
    /INV-01/,
  );
  await page.getByRole("button", { name: /Lỗi inverter/ }).click();
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "INV-01", exact: true })
    .click();
  await expect(page.locator(".hud-status")).toHaveText(
    "Lỗi inverter · xem thử",
  );
  await expect(page.locator(".scene-hud")).toHaveClass(/critical/);
  await expect(page.locator(".scene-hud .scenario-status-note")).toContainText(
    "Vận hành nền: Bình thường",
  );
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("canvas").getAttribute("data-device-outlines"))!,
        )["INV-01"],
    )
    .toBe("e44538");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.locator(".details-status")).toHaveText(
    "Lỗi inverter · xem thử",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "chưa tính tác động kịch bản",
  );
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await page.getByRole("button", { name: /Bám bụi/ }).click();
  await expect(page.locator(".hud-status")).toHaveText("Bám bụi · xem thử");
  await expect(page.locator(".scene-hud")).toHaveClass(/warning/);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".hud-status")).toHaveText("Bình thường");
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
