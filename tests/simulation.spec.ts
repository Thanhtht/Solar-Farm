import { test, expect } from "@playwright/test";
import {
  createRun,
  generate,
  transition,
  quality,
  baseline,
} from "../src/lib/simulation";
test("Baseline conserves DC/AC, integrates energy and replays deterministically", () => {
  const initial = createRun();
  expect(initial.assets).toHaveLength(19);
  expect(initial.dcMW).toBeCloseTo(36);
  expect(initial.powerMW).toBeCloseTo(34.56);
  expect(
    initial.assets.find((a) => a.id === "TR-01")!.signals[0].value,
  ).toBeCloseTo(initial.powerMW!);
  let run = transition(initial, "play");
  for (let i = 0; i < 60; i++) run = transition(run, "tick");
  expect(run.energyMWh).toBeCloseTo(34.56);
  expect(run.times).toHaveLength(61);
  expect(
    run.assets.every((a) =>
      a.signals.every(
        (s) =>
          s.snapshotId === run.id &&
          s.revision === run.revision &&
          s.history.length === 61,
      ),
    ),
  ).toBe(true);
  let replay = transition(createRun(), "play");
  for (let i = 0; i < 60; i++) replay = transition(replay, "tick");
  expect(replay).toEqual(run);
  const paused = transition(run, "pause");
  expect(transition(paused, "tick")).toBe(paused);
  const reset = transition(paused, "reset");
  expect(reset.energyMWh).toBe(0);
  expect(reset.revision).toBe(2);
  expect(reset.times).toHaveLength(1);
  expect(reset.running).toBe(false);
});
test("Missing, invalid, stale and operational faults are distinct from heartbeat", () => {
  const run = generate("quality", 3, 3, {
    signals: {
      "INV-01.pac": { value: null },
      "INV-02.pac": { sampledAt: baseline.start },
      "INV-04.temp": { value: NaN },
    },
    faults: ["INV-03"],
  });
  expect(run.powerMW).toBeNull();
  expect(run.missingInverters).toBe(2);
  expect(run.assets.find((a) => a.id === "TR-01")!.signals[0].value).toBeNull();
  expect(run.assets.find((a) => a.id === "INV-02")!.signals[0].quality).toBe(
    "stale",
  );
  expect(run.assets.find((a) => a.id === "INV-04")!.signals[1].quality).toBe(
    "invalid",
  );
  const fault = run.assets.find((a) => a.id === "INV-03")!;
  expect(fault.operation).toBe("Sự cố");
  expect(fault.connection).toBe("Đang kết nối");
  expect(fault.signals[0].value).toBe(0);
  expect(run.availability).toBe(87.5);
  expect(
    quality(
      { value: 1, quality: "valid", sampledAt: baseline.start },
      new Date(Date.parse(baseline.start) + 120000).toISOString(),
    ),
  ).toBe("valid");
  expect(createRun().availability).toBe(100);
});
test("Baseline browser playback pauses, resets and keeps selection and camera", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByRole("region", { name: "Chọn kịch bản mô phỏng" })
    .getByRole("button", { name: /Mây che/ })
    .click();
  const scene = page.getByTestId("scene");
  await expect(scene.locator("canvas")).toBeVisible();
  const canvas = scene.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-position", /\[/);
  await page.waitForTimeout(700);
  const position = await canvas.getAttribute("data-camera-position");
  const target = await canvas.getAttribute("data-camera-target");
  await page
    .getByRole("button", { name: "Chạy mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("run-time")).not.toContainText("10:30 ICT");
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const time = await page.getByTestId("run-time").textContent();
  await page.waitForTimeout(1300);
  expect(await page.getByTestId("run-time").textContent()).toBe(time);
  expect(await canvas.getAttribute("data-camera-position")).toBe(position);
  expect(await canvas.getAttribute("data-camera-target")).toBe(target);
  await expect(
    page.getByRole("region", { name: "Hồ sơ nhanh thiết bị" }),
  ).toContainText("INV-01");
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await expect(page.getByRole("dialog")).toContainText("Hợp lệ");
  await page.getByRole("button", { name: "Đóng hồ sơ thiết bị" }).click();
  await page
    .getByRole("button", { name: "Đặt lại mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("run-time")).toContainText("10:30 ICT");
  await expect(page.getByTestId("run-time")).toHaveAttribute(
    "data-revision",
    "3",
  );
  await expect(
    page.getByRole("region", { name: "Hồ sơ nhanh thiết bị" }),
  ).toContainText("INV-01");
});

test("Current monitoring and simulation keep independent data, selection and scenario state", async ({
  page,
}) => {
  await page.goto("/");
  const currentTab = page.getByRole("tab", { name: "Hiện trạng", exact: true });
  const simulationTab = page.getByRole("tab", {
    name: "Mô phỏng",
    exact: true,
  });
  await expect(currentTab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: "Chạy mô phỏng", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".scenario-card")).toHaveCount(0);
  const initialKpis = await page.locator(".kpis").textContent();
  const initialHistory = await page
    .locator(".chart-panel svg")
    .getAttribute("aria-label");
  await simulationTab.click();
  await page.getByRole("button", { name: /Mây che/ }).click();
  await expect(page.locator(".preview-label")).toContainText("Mây che");
  await page
    .getByRole("button", { name: "Danh sách thiết bị", exact: true })
    .click();
  await page
    .locator(".device-buttons")
    .getByRole("button", { name: "PV-06", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Chạy mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("run-time")).not.toContainText("10:30 ICT");
  await currentTab.click();
  await expect(page.locator(".kpis")).toHaveText(initialKpis!);
  await expect(page.locator(".chart-panel svg")).toHaveAttribute(
    "aria-label",
    initialHistory!,
  );
  await expect(page.locator(".preview-label")).toHaveCount(0);
  await expect(page.locator(".hud-identity")).toContainText("INV-01");
  await simulationTab.click();
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hud-identity")).toContainText("PV-06");
  await expect(page.locator(".scenario-card.chosen")).toContainText("Mây che");
  const pausedTime = await page.getByTestId("run-time").textContent();
  await page.waitForTimeout(1200);
  expect(await page.getByTestId("run-time").textContent()).toBe(pausedTime);
  await page
    .getByRole("button", { name: "Đặt lại mô phỏng", exact: true })
    .click();
  await currentTab.click();
  await expect(page.locator(".kpis")).toHaveText(initialKpis!);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(currentTab).toBeVisible();
  await expect(simulationTab).toBeVisible();
  await currentTab.focus();
  await currentTab.press("ArrowRight");
  await expect(simulationTab).toHaveAttribute("aria-selected", "true");
});
