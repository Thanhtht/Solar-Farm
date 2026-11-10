import { test, expect } from "@playwright/test";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import {
  integrateHistory,
  monitoringMetrics,
} from "../src/lib/monitoring-metrics";
import {
  createSession,
  forecast,
  powerAt,
  presetConfig,
  sessionAction,
} from "../src/lib/scenario-simulation";

test("Metric details reconcile histories, references, energy, availability and missing samples", () => {
  const snapshot = createMonitoringSnapshot();
  const data = monitoringMetrics(snapshot);
  expect(data.energy.at(-1)).toBeCloseTo(snapshot.energyMWh);
  expect(data.loss.at(-1)).toBeCloseTo(snapshot.lossMWh);
  expect(data.referenceEnergy.at(-1)! - data.energy.at(-1)!).toBeCloseTo(
    snapshot.lossMWh,
  );
  expect(data.reference.at(-1)).toBeCloseTo(34.56);
  expect(data.reduction.at(-1)).toBeCloseTo(4.4064);
  expect(data.energy[15]).toBeCloseTo(8.1792);
  expect(data.energy[30]! - data.energy[15]!).toBeCloseTo(7.5456);
  expect(data.availability.slice(0, 15).every((value) => value === 100)).toBe(
    true,
  );
  expect(data.availability.slice(15).every((value) => value === 87.5)).toBe(
    true,
  );
  expect(integrateHistory([60, null, 60, 60])).toEqual([0, 1, null, null]);
});

test("Scenarios inherit monitoring issues and add only incremental loss without mutating the initial state", () => {
  const initial = createMonitoringSnapshot();
  const saved = JSON.stringify(initial);
  const all = { ...presetConfig("fault"), scale: 8, duration: 60 };
  const session = createSession(all, 1, initial);
  expect(session.base.powerMW).toBeCloseTo(30.1536);
  expect(session.base.availability).toBe(87.5);
  expect(session.base.assets.filter((asset) => asset.attention)).toHaveLength(
    3,
  );
  expect(
    session.base.assets.find((asset) => asset.id === "GW-01")!.signals[1].value,
  ).toBe(850);
  expect(session.untreated.powerMW).toBe(0);
  expect(session.untreated.times).toEqual(initial.times);
  expect(forecast(all, initial).lossMWh).toBeCloseTo(30.1536);
  expect(
    forecast(
      {
        ...all,
        target: "INV-03",
        scale: 1,
        intervention: true,
        interventionMinute: 30,
      },
      initial,
    ).lossMWh,
  ).toBeCloseTo(0);
  const cloud = { ...presetConfig("cloud"), scale: 8, duration: 60 };
  expect(powerAt(cloud, 0, false, initial)).toBeCloseTo(30.1536 * 0.55);
  let running = sessionAction(createSession(cloud, 2, initial), "play");
  for (let minute = 0; minute < 60; minute++)
    running = sessionAction(running, "tick");
  const estimate = forecast(cloud, initial);
  expect(running.base.energyMWh).toBeCloseTo(30.1536);
  expect(running.untreated.lossMWh).toBeCloseTo(estimate.lossMWh);
  expect(running.untreated.energyMWh).toBeCloseTo(estimate.untreatedMWh);
  const reset = sessionAction(running, "reset");
  expect(reset.base.powerMW).toBeCloseTo(30.1536);
  expect(reset.config.kind).toBeNull();
  expect(
    reset.base.assets.find((asset) => asset.id === "INV-03")!.signals[0].value,
  ).toBe(0);
  expect(JSON.stringify(initial)).toBe(saved);
  expect(session.initial).not.toBe(initial);
});

test("KPI cards open useful details and device links without lower panels", async ({
  page,
}) => {
  await page.goto("/plants/sava");
  await expect(
    page.locator(".chart-panel,.weather-panel,.notice-panel"),
  ).toHaveCount(0);
  for (const [title, detail] of [
    ["Công suất AC", "Đóng góp công suất của từng inverter"],
    ["Năng lượng tích lũy", "Sản lượng theo khoảng 15 phút"],
    ["Khả dụng thiết bị", "1 Cảnh báo · 2 Lưu ý"],
    ["Tổn thất năng lượng", "Thiết bị gây tổn thất"],
  ]) {
    const card = page
      .locator(".kpis")
      .getByRole("button", { name: new RegExp(title) });
    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(dialog).toContainText(detail);
    await expect(dialog.locator("svg.trend circle")).toHaveCount(31);
    await expect(dialog.locator("svg.trend")).toHaveAttribute(
      "aria-label",
      /10:00 đến 10:30/,
    );
    if (title === "Công suất AC")
      await page.screenshot({ path: "test-results/power-metric-dialog.png" });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
  }
  await page
    .locator(".kpis")
    .getByRole("button", { name: /Khả dụng thiết bị/ })
    .click();
  await page
    .getByLabel("Thiết bị cần chú ý")
    .getByRole("button", { name: /PV-06/ })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".hud-identity")).toContainText("PV-06");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".kpis")
    .getByRole("button", { name: /Năng lượng tích lũy/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("15,72");
  await page.screenshot({ path: "test-results/energy-metric-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("Simulation starts from current state, retains existing fault and resets scenarios cleanly", async ({
  page,
}) => {
  await page.goto("/plants/sava");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-power-links", /INV-03/);
  const links = await canvas.getAttribute("data-power-links");
  const colors = await canvas.getAttribute("data-device-colors");
  const kpis = await page.locator(".kpis").textContent();
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-power-links", links!);
  await expect(page.locator(".setup-note")).toContainText("30,15 MW");
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("4,32 MWh");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-power-links"))!)[
          "INV-03->TR-01"
        ].powerMW,
    )
    .toBe(0);
  await page
    .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
    .click();
  await expect(
    page.getByLabel("Kịch bản mô phỏng", { exact: true }),
  ).toHaveValue("");
  await expect(page.getByTestId("simple-energy-loss")).toContainText("—");
  await expect(canvas).toHaveAttribute("data-power-links", links!);
  await expect(canvas).toHaveAttribute("data-cloud-assets", "[]");
  for (const kind of ["dust", "cloud"]) {
    await page
      .getByLabel("Kịch bản mô phỏng", { exact: true })
      .selectOption(kind);
    await page
      .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
      .click();
    if (kind === "dust")
      await expect(canvas).not.toHaveAttribute("data-device-colors", colors!);
    else await expect(canvas).not.toHaveAttribute("data-cloud-assets", "[]");
    await page
      .getByRole("button", { name: "Về trạng thái ban đầu", exact: true })
      .click();
    await expect(canvas).toHaveAttribute("data-power-links", links!);
    await expect(canvas).toHaveAttribute("data-device-colors", colors!);
    await expect(canvas).toHaveAttribute("data-cloud-assets", "[]");
  }
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis")).toHaveText(kpis!);
});
