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
import {
  createHongLiemSnapshot,
  initialHongLiemConfig,
} from "../src/lib/hong-liem-simulation";

test("Photo trace projects back to the reference; all regions retain their gaps and contained model footprints", () => {
  const camera = new PerspectiveCamera(43, 640 / 425, 0.3, 1800);
  camera.position.set(...hongLiemCamera);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  for (const field of hongLiemFields) {
    expect(field.rows.length, field.id).toBeGreaterThan(0);
    field.photoPolygon.forEach((pixel, index) => {
      const point = new Vector3(
        field.polygon[index][0],
        0,
        field.polygon[index][1],
      ).project(camera);
      expect((point.x + 1) * 320).toBeCloseTo(pixel[0], 5);
      expect((1 - point.y) * 212.5).toBeCloseTo(pixel[1], 5);
    });
    for (const row of field.rows) {
      expect(
        insidePolygon([row.position[0], row.position[2]], field.polygon),
      ).toBe(true);
      expect(
        insidePolygon([row.position[0], row.position[2]], vegetationIsland),
      ).toBe(false);
      for (const dx of [-4.55 * pvRowScale[0], 4.55 * pvRowScale[0]])
        for (const dz of [-4.95 * pvRowScale[2], 4.95 * pvRowScale[2]])
          expect(
            insidePolygon(
              [
                row.position[0] +
                  dx * Math.cos(pvRowRotation) +
                  dz * Math.sin(pvRowRotation),
                row.position[2] -
                  dx * Math.sin(pvRowRotation) +
                  dz * Math.cos(pvRowRotation),
              ],
              field.polygon,
            ),
          ).toBe(true);
    }
  }
  expect(hongLiemFields.reduce((s, f) => s + f.rows.length, 0)).toBeGreaterThan(
    500,
  );
  expect(photoToGround([320, 212.5])).toEqual([0, 0]);
});

test("Hong Liem telemetry is deterministic, additive, independent and clips before computing energy", () => {
  const current = createHongLiemSnapshot();
  expect(current).toEqual(createHongLiemSnapshot());
  expect(current.fields.reduce((s, f) => s + f.dcMWp, 0)).toBeCloseTo(50, 10);
  expect(current.powerMW).toBeCloseTo(
    current.fields.reduce((s, f) => s + f.powerMW, 0),
    10,
  );
  const field = current.fields[0];
  for (const scenario of ["cloud", "dust", "fault"] as const) {
    const simulated = createHongLiemSnapshot({
      ...initialHongLiemConfig,
      scenario,
      target: field.id,
      durationHours: 4,
    });
    expect(simulated.fields.slice(1).map((f) => f.powerMW)).toEqual(
      current.fields.slice(1).map((f) => f.powerMW),
    );
    expect(simulated.lossMWh).toBeCloseTo(
      (current.powerMW - simulated.powerMW) * 4,
      10,
    );
    expect(simulated.energyMWh).toBeCloseTo(simulated.powerMW * 4, 10);
    expect(simulated.fields[0].connected).toBe(true);
    if (scenario === "fault") {
      expect(simulated.fields[0].powerMW).toBe(0);
      expect(simulated.availability).toBeCloseTo(1100 / 12);
    }
  }
  expect(current).toEqual(createHongLiemSnapshot());
  const bright = createHongLiemSnapshot({
    ...initialHongLiemConfig,
    irradiance: 1100,
  });
  expect(bright.powerMW).toBeCloseTo(40);
  const cloudy = createHongLiemSnapshot({
    ...initialHongLiemConfig,
    irradiance: 1100,
    scenario: "cloud",
  });
  expect(cloudy.powerMW).toBeGreaterThan(40 * 0.65);
  expect(cloudy.powerMW).toBeLessThan(40);
  const night = createHongLiemSnapshot({
    ...initialHongLiemConfig,
    irradiance: 0,
  });
  expect(night.powerMW).toBe(0);
  expect(night.availability).toBe(100);
});

test("Hong Liem 3D loads shared models, selects cells, changes camera and keeps simulation independent", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("link", { name: "Khám phá Nhà máy điện Hồng Liêm 3" })
    .click();
  const canvas = page.locator(".hl3-canvas canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 45000,
  });
  expect(Number(await canvas.getAttribute("data-pv-rows"))).toBeGreaterThan(
    500,
  );
  await expect(page.getByText("Đang dựng nhà máy Hồng Liêm 3…")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/hong-liem-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Hiện nhãn vùng", exact: true })
    .click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const [x, y] = JSON.parse((await canvas.getAttribute("data-pv-pick"))!);
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  const detail = page.getByRole("region", { name: "Chi tiết thiết bị" });
  await expect(detail).toContainText("HL3-PV-01");
  await page.getByRole("button", { name: "Phóng tới vùng trong 3D" }).click();
  await expect(canvas).toHaveAttribute("data-focus-target", "HL3-PV-01", {
    timeout: 15000,
  });
  await expect
    .poll(() => canvas.getAttribute("data-camera-position"), { timeout: 15000 })
    .not.toBe(JSON.stringify(hongLiemCamera));
  await page
    .getByRole("button", { name: "Góc nhìn từ trên", exact: true })
    .click();
  await page.screenshot({ path: "test-results/hong-liem-top.png" });
  await page
    .getByRole("button", { name: "Góc nhìn theo ảnh", exact: true })
    .click();
  await expect
    .poll(async () =>
      JSON.parse((await canvas.getAttribute("data-camera-position"))!).map(
        (n: number) => Math.round(n),
      ),
    )
    .toEqual(hongLiemCamera);
  const initial = await page.getByTestId("hl3-power").textContent();
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Kịch bản", exact: true })
    .selectOption("fault");
  await page
    .getByRole("combobox", { name: "Vùng ảnh hưởng", exact: true })
    .selectOption("HL3-PV-01");
  await page
    .getByRole("combobox", { name: "Thời lượng", exact: true })
    .selectOption("4");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(detail).toContainText("Dừng phát điện");
  await expect(page.getByTestId("hl3-loss")).not.toHaveText("0MWh");
  await page.getByRole("button", { name: "Hiện trạng", exact: true }).click();
  await expect(page.getByTestId("hl3-power")).toHaveText(initial!);
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  await expect(detail).toContainText("Dừng phát điện");
  await page
    .getByRole("button", { name: "Đặt lại mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("hl3-power")).toHaveText(initial!);
  await page.getByRole("button", { name: "Hiện trạng", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Góc nhìn theo ảnh", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".hl3-scene-panel")
    .screenshot({ path: "test-results/hong-liem-mobile-3d.png" });
  expect(errors).toEqual([]);
});

test("Mobile selection and fallback retain access to independent plant data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.goto("/plants/hong-liem-3");
  await expect(page.locator(".hl3-canvas [role=alert]")).toContainText(
    "WebGL chưa khả dụng",
  );
  await page.getByLabel("Tìm vùng hoặc inverter").fill("HL3-INV-04");
  await page
    .getByRole("button", { name: "Xem inverter HL3-INV-04", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Chi tiết thiết bị" }),
  ).toContainText("Đông trung tâm");
  await page.getByRole("button", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Kịch bản", exact: true })
    .selectOption("dust");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/hong-liem-mobile-fallback.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Về danh sách nhà máy", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Khám phá Nhà máy điện Sava", exact: true }),
  ).toBeVisible();
});
