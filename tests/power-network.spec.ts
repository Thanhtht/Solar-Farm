import { test, expect } from "@playwright/test";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { buildPowerLinks } from "../src/lib/power-network";
import { createRun, generate } from "../src/lib/simulation";

test("Power routes follow electrical relations, preserve MW and separate issues from stopped flow", () => {
  const snapshot = createMonitoringSnapshot();
  const links = buildPowerLinks(snapshot.assets);
  expect(links).toHaveLength(16);
  expect(links.filter((link) => link.kind === "DC")).toHaveLength(8);
  expect(new Set(links.map((link) => link.id)).size).toBe(16);
  for (const link of links) {
    const from = snapshot.assets.find((asset) => asset.id === link.from)!;
    expect(from.related).toContain(link.to);
    expect(link.points.every((point) => point.every(Number.isFinite))).toBe(
      true,
    );
    expect(link.id).not.toMatch(/GW|MET/);
  }
  expect(
    links
      .filter((link) => link.state === "affected")
      .map((link) => link.id)
      .sort(),
  ).toEqual([
    "INV-03->TR-01",
    "INV-06->TR-01",
    "PV-03->INV-03",
    "PV-06->INV-06",
  ]);
  expect(links.find((link) => link.id === "INV-03->TR-01")).toMatchObject({
    state: "affected",
    running: false,
    powerMW: 0,
  });
  expect(links.find((link) => link.id === "INV-06->TR-01")).toMatchObject({
    state: "affected",
    running: true,
    powerMW: 4.32,
  });
  expect(links.find((link) => link.id === "PV-01->INV-01")).toMatchObject({
    state: "normal",
    running: true,
    powerMW: 4.5,
  });
  expect(
    links
      .filter((link) => link.kind === "AC")
      .reduce((sum, link) => sum + link.powerMW!, 0),
  ).toBeCloseTo(snapshot.powerMW!);
  expect(
    links
      .filter((link) => link.kind === "DC")
      .reduce((sum, link) => sum + link.powerMW!, 0) * 0.96,
  ).toBeCloseTo(snapshot.powerMW!);
  const healthy = createRun().assets.map((asset) => ({
    ...asset,
    operation: "Bình thường",
    attention:
      asset.type === "gateway"
        ? {
            level: "warning" as const,
            reason: "Độ trễ dữ liệu",
            signalId: "GW-01.latency",
          }
        : undefined,
  }));
  expect(
    buildPowerLinks(healthy).every((link) => link.state === "normal"),
  ).toBe(true);
  const missing = generate("quality", 1, 3, {
    signals: {
      "INV-01.pac": { value: null },
      "INV-02.pac": { sampledAt: "2026-11-02T03:30:00.000Z" },
    },
  });
  for (const id of ["INV-01->TR-01", "INV-02->TR-01"])
    expect(
      buildPowerLinks(missing.assets).find((link) => link.id === id),
    ).toMatchObject({ state: "unknown", powerMW: null, running: false });
  const allFaults = generate("stopped", 1, 0, {
    faults: snapshot.assets
      .filter((asset) => asset.type === "inverter")
      .map((asset) => asset.id),
  });
  expect(
    buildPowerLinks(allFaults.assets).every(
      (link) =>
        link.state === "affected" && !link.running && link.powerMW === 0,
    ),
  ).toBe(true);
});

test("Rendered cables and arrows follow current/scenario state, reduced motion and real picking", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-power-links", /PV-01->INV-01/, {
    timeout: 20000,
  });
  const read = async () =>
    JSON.parse((await canvas.getAttribute("data-power-links"))!);
  await expect
    .poll(async () => (await read())["INV-03->TR-01"])
    .toEqual({ color: "e44538", powerMW: 0, running: false });
  expect((await read())["PV-01->INV-01"]).toEqual({
    color: "008b65",
    powerMW: 4.5,
    running: true,
  });
  expect((await read())["INV-06->TR-01"]).toEqual({
    color: "e44538",
    powerMW: 4.32,
    running: true,
  });
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "animated");
  const first = await canvas.getAttribute("data-power-flow-first-arrow");
  await expect
    .poll(() => canvas.getAttribute("data-power-flow-first-arrow"))
    .not.toBe(first);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "reduced");
  await page.waitForTimeout(150);
  const still = await canvas.getAttribute("data-power-flow-first-arrow");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-power-flow-first-arrow")).toBe(still);
  await page.locator(".scene-panel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/power-network-current.png" });
  // Click the rendered PV itself; cable/arrow meshes must not intercept picking.
  const box = await canvas.boundingBox();
  const positions = JSON.parse(
    (await canvas.getAttribute("data-device-projections"))!,
  );
  await page.mouse.click(
    box!.x + positions["PV-02"][0] * box!.width,
    box!.y + positions["PV-02"][1] * box!.height,
  );
  await expect(page.locator(".hud-identity")).toContainText("PV-02");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("cloud");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect
    .poll(async () => (await read())["PV-01->INV-01"].powerMW)
    .toBeCloseTo(2.475);
  expect((await read())["PV-01->INV-01"].running).toBe(true);
  expect((await read())["PV-01->INV-01"].color).toBe("e44538");
  await page
    .getByLabel("Kịch bản mô phỏng", { exact: true })
    .selectOption("fault");
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("8");
  await page
    .getByRole("button", { name: "Xem kết quả mô phỏng", exact: true })
    .click();
  await expect
    .poll(async () =>
      Object.values(await read()).every((link) => {
        const state = link as { color: string; running: boolean };
        return state.color === "e44538" && !state.running;
      }),
    )
    .toBe(true);
  await expect(canvas).toHaveAttribute("data-power-flow-first-arrow", "null");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "stopped");
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect
    .poll(async () => (await read())["PV-01->INV-01"].color)
    .toBe("008b65");
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "animated");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.locator(".scene-panel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/power-network-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
