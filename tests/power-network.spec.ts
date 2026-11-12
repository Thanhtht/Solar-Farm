import { test, expect } from "@playwright/test";
import { createMonitoringSnapshot } from "../src/lib/monitoring";
import { buildPowerLinks } from "../src/lib/power-network";
import { createRun, generate } from "../src/lib/simulation";
import { createSession, presetConfig } from "../src/lib/scenario-simulation";

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
      .filter((link) => link.state !== "normal" && link.state !== "unknown")
      .map((link) => link.id)
      .sort(),
  ).toEqual([
    "INV-03->TR-01",
    "INV-06->TR-01",
    "PV-03->INV-03",
    "PV-06->INV-06",
  ]);
  expect(links.find((link) => link.id === "INV-03->TR-01")).toMatchObject({
    state: "stopped",
    running: false,
    powerMW: 0,
  });
  expect(links.find((link) => link.id === "INV-06->TR-01")).toMatchObject({
    state: "degraded",
    running: true,
    powerMW: 4.2336,
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
  const darkCloud = createSession(
    { ...presetConfig("cloud"), severity: 100, scale: 1 },
    1,
    snapshot,
  );
  for (const id of ["PV-01->INV-01", "INV-01->TR-01"])
    expect(
      buildPowerLinks(darkCloud.untreated.assets).find(
        (link) => link.id === id,
      ),
    ).toMatchObject({ state: "stopped", powerMW: 0, running: false });
  const allFaults = generate("stopped", 1, 0, {
    faults: snapshot.assets
      .filter((asset) => asset.type === "inverter")
      .map((asset) => asset.id),
  });
  expect(
    buildPowerLinks(allFaults.assets).every(
      (link) => link.state === "stopped" && !link.running && link.powerMW === 0,
    ),
  ).toBe(true);
});

test("Rendered cables and dots follow current/scenario state, reduced motion and real picking", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/plants/sava");
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
    color: "e9b323",
    powerMW: 4.2336,
    running: true,
  });
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "animated");
  await expect(canvas).toHaveAttribute("data-power-flow-marker", "dot");
  expect(
    Number(await canvas.getAttribute("data-power-flow-dot-radius")),
  ).toBeLessThanOrEqual(0.12);
  const first = await canvas.getAttribute("data-power-flow-first-dot");
  await expect
    .poll(() => canvas.getAttribute("data-power-flow-first-dot"))
    .not.toBe(first);
  await page.getByRole("button", { name: "Góc nhìn tổng quan" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-power-flow-motion", "reduced");
  await page.waitForTimeout(150);
  const still = await canvas.getAttribute("data-power-flow-first-dot");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-power-flow-first-dot")).toBe(still);
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
  expect((await read())["PV-01->INV-01"].color).toBe("e9b323");
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
  await expect(canvas).toHaveAttribute("data-power-flow-first-dot", "null");
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

test("Flow markers keep wall-clock speed in both plants and pause without catch-up", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  for (const [plantId, speed] of [
    ["sava", 3],
    ["hong-liem-3", 12],
  ] as const) {
    const link = buildPowerLinks(
      createMonitoringSnapshot(plantId).assets,
      plantId,
    ).find((l) => l.running)!;
    const lengths = link.points
      .slice(1)
      .map((p, i) =>
        Math.hypot(
          ...(p.map((v, j) => v - link.points[i][j]) as [
            number,
            number,
            number,
          ]),
        ),
      );
    const total = lengths.reduce((s, l) => s + l, 0);
    const arc = (point: number[]) => {
      let nearest = { distance: Infinity, arc: 0 },
        prefix = 0;
      for (let i = 0; i < lengths.length; i++) {
        const a = link.points[i],
          b = link.points[i + 1],
          d = b.map((v, j) => v - a[j]);
        const ratio =
          lengths[i] === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  point.reduce((s, v, j) => s + (v - a[j]) * d[j], 0) /
                    (lengths[i] * lengths[i]),
                ),
              );
        const distance = Math.hypot(
          ...(a.map((v, j) => v + d[j] * ratio - point[j]) as [
            number,
            number,
            number,
          ]),
        );
        if (distance < nearest.distance)
          nearest = { distance, arc: prefix + ratio * lengths[i] };
        prefix += lengths[i];
      }
      expect(nearest.distance).toBeLessThan(0.001);
      return nearest.arc;
    };
    await page.goto(`/plants/${plantId}`);
    const canvas = page.locator("#plant-view canvas");
    await expect(canvas).toHaveAttribute("data-power-flow-motion", "animated", {
      timeout: 45000,
    });
    const read = () =>
      canvas.evaluate((el) => ({
        time: Number(el.dataset.powerFlowTimestamp),
        point: JSON.parse(el.dataset.powerFlowFirstDot!),
      }));
    await expect(canvas).toHaveAttribute("data-power-flow-first-dot", /^\[/);
    const first = await read();
    await expect
      .poll(async () => (await read()).time - first.time)
      .toBeGreaterThan(300);
    const second = await read();
    const expected =
      (arc(first.point) + (speed * (second.time - first.time)) / 1000) % total;
    const difference = Math.abs(arc(second.point) - expected);
    expect(Math.min(difference, total - difference)).toBeLessThan(0.01);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-power-flow-motion", "reduced");
    const paused = await read();
    await page.waitForTimeout(250);
    expect((await read()).point).toEqual(paused.point);
    const resumeAt = await page.evaluate(() => performance.now());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(canvas).toHaveAttribute("data-power-flow-motion", "animated");
    await expect
      .poll(async () => (await read()).time)
      .toBeGreaterThan(resumeAt);
    const resumed = await read();
    await expect
      .poll(async () => (await read()).time - resumed.time)
      .toBeGreaterThan(200);
    const moved = await read();
    const resumedExpected =
      (arc(resumed.point) + (speed * (moved.time - resumed.time)) / 1000) %
      total;
    const resumedDifference = Math.abs(arc(moved.point) - resumedExpected);
    expect(Math.min(resumedDifference, total - resumedDifference)).toBeLessThan(
      0.01,
    );
  }
});
