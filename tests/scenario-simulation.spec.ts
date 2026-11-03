import { test, expect } from "@playwright/test";
import {
  createSession,
  defaultConfig,
  presetConfig,
  forecast,
  sessionAction,
  normalizeConfig,
  type Session,
} from "../src/lib/scenario-simulation";
function finish(session: Session) {
  let next = sessionAction(session, "play");
  while (next.phase === "running") next = sessionAction(next, "tick");
  return next;
}
function signal(
  session: Session,
  id: string,
  key: string,
  layer: "untreated" | "treated" = "untreated",
) {
  return session[layer].assets
    .find((a) => a.id === id)!
    .signals.find((s) => s.id === `${id}.${key}`)!;
}

test("Three scenarios produce conserved DC/AC and exact minute-integrated energy", () => {
  for (const kind of ["cloud", "dust", "fault"] as const) {
    const session = createSession(presetConfig(kind));
    const end = finish(session);
    const projected = forecast(session.config);
    expect(end.untreated.energyMWh).toBeCloseTo(projected.untreatedMWh, 10);
    expect(end.untreated.lossMWh).toBeCloseTo(projected.lossMWh, 10);
    expect(end.untreated.energyMWh + end.untreated.lossMWh).toBeCloseTo(
      end.base.energyMWh,
      10,
    );
    expect(end.elapsed).toBe(session.config.duration);
    expect(end.untreated.times).toHaveLength(session.config.duration + 1);
    expect(
      end.untreated.assets.every((a) =>
        a.signals.every(
          (s) =>
            s.revision === end.revision &&
            s.snapshotId === end.untreated.id &&
            s.history.length === end.elapsed + 1,
        ),
      ),
    ).toBe(true);
    expect(signal(session, "TR-01", "power").value).toBeCloseTo(
      session.untreated.powerMW!,
      10,
    );
  }
  expect(forecast(presetConfig("cloud")).lossMWh).toBeCloseTo(3.888);
  expect(forecast(presetConfig("dust")).lossMWh).toBeCloseTo(0.864);
  expect(forecast(presetConfig("fault")).lossMWh).toBeCloseTo(2.16);
});
test("Cloud recovers naturally; dust and faults persist at the assessment boundary", () => {
  expect(
    finish(createSession(presetConfig("cloud"))).untreated.powerMW,
  ).toBeCloseTo(34.56);
  for (const kind of ["dust", "fault"] as const)
    expect(
      finish(createSession(presetConfig(kind))).untreated.powerMW,
    ).toBeLessThan(34.56);
  const fault = createSession(presetConfig("fault"));
  expect(signal(fault, "INV-01", "pac").value).toBe(0);
  expect(signal(fault, "INV-01", "fault").value).toBe(1);
  expect(signal(fault, "PV-01", "pdc").value).toBe(0);
  expect(
    fault.untreated.assets.find((a) => a.id === "INV-01")!.connection,
  ).toBe("Đang kết nối");
  expect(fault.untreated.availability).toBe(87.5);
  expect(createSession(presetConfig("cloud")).untreated.availability).toBe(100);
  const all = finish(
    createSession({ ...presetConfig("fault"), target: "all" }),
  );
  expect(all.untreated.powerMW).toBe(0);
  expect(all.untreated.energyMWh).toBe(0);
  expect(all.untreated.availability).toBe(0);
});
test("Zero reduction is baseline and inputs are bounded or rejected", () => {
  for (const kind of ["dust", "cloud"] as const) {
    const end = finish(createSession({ ...presetConfig(kind), severity: 0 }));
    expect(end.untreated.powerMW).toBeCloseTo(34.56);
    expect(end.untreated.lossMWh).toBeCloseTo(0);
    expect(end.untreated.assets.some((a) => a.scenario)).toBe(false);
  }
  expect(
    normalizeConfig({
      ...defaultConfig,
      kind: "dust",
      severity: 999,
      duration: 999,
      recovery: 200,
      interventionMinute: 999,
    }),
  ).toMatchObject({
    severity: 50,
    duration: 120,
    recovery: 100,
    interventionMinute: 120,
  });
  for (const value of [NaN, Infinity, -Infinity])
    expect(() =>
      createSession({ ...defaultConfig, severity: value }),
    ).toThrow();
  expect(() =>
    createSession({ ...defaultConfig, target: "unknown" }),
  ).toThrow();
});
test("Cleaning/repair comparisons share time, never exceed baseline, and recover analytic MWh", () => {
  for (const kind of ["dust", "fault"] as const) {
    const config = { ...presetConfig(kind), intervention: true };
    const end = finish(createSession(config));
    expect(end.treated.times).toEqual(end.untreated.times);
    expect(end.treated.energyMWh - end.untreated.energyMWh).toBeCloseTo(
      forecast(config).recoveredMWh,
      10,
    );
    expect(forecast(config).recoveredMWh).toBeCloseTo(
      kind === "dust" ? 0.432 : 1.08,
    );
    end.treated.powerHistory.forEach((p, i) => {
      expect(p!).toBeLessThanOrEqual(end.base.powerHistory[i]! + 1e-10);
      expect(p!).toBeGreaterThanOrEqual(end.untreated.powerHistory[i]! - 1e-10);
    });
    expect(end.treated.powerMW).toBeCloseTo(34.56);
    expect(
      forecast({ ...config, interventionMinute: 0 }).recoveredMWh,
    ).toBeCloseTo(forecast(config).lossMWh);
    expect(
      forecast({ ...config, interventionMinute: config.duration }).recoveredMWh,
    ).toBeCloseTo(0);
  }
  const dust = { ...presetConfig("dust"), intervention: true, recovery: 50 };
  expect(forecast(dust).recoveredMWh).toBeCloseTo(0.216);
  expect(
    forecast({ ...presetConfig("cloud"), intervention: true }).recoveredMWh,
  ).toBeCloseTo(0);
});
test("Pause, completion, restart, reset and revised inputs cannot retain obsolete history", () => {
  let run = sessionAction(createSession(presetConfig("dust")), "play");
  run = sessionAction(run, "tick");
  const paused = sessionAction(run, "pause");
  expect(sessionAction(paused, "tick")).toBe(paused);
  expect(finish(createSession(presetConfig("dust")))).toEqual(
    finish(createSession(presetConfig("dust"))),
  );
  const end = finish(run);
  expect(sessionAction(end, "tick")).toBe(end);
  const restart = sessionAction(end, "restart");
  expect(restart.revision).toBe(end.revision + 1);
  expect(restart.elapsed).toBe(0);
  expect(restart.untreated.energyMWh).toBe(0);
  const changed = createSession(
    { ...end.config, severity: 30 },
    end.revision + 1,
  );
  expect(changed.phase).toBe("preview");
  expect(changed.untreated.times).toHaveLength(1);
  expect(changed.untreated.lossMWh).toBe(0);
  expect(sessionAction(end, "reset").config.kind).toBeNull();
});

test("Browser runs each preset, switches repair layers, invalidates changes and preserves the camera", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const picker = page.getByRole("region", { name: "Chọn kịch bản mô phỏng" });
  await page.locator(".simulation-advanced > summary").click();
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-position", /\[/);
  await page.waitForTimeout(500);
  const camera = await canvas.getAttribute("data-camera-position");
  for (const kind of ["Mây che", "Bám bụi", "Lỗi inverter"]) {
    await picker.getByRole("button", { name: new RegExp(kind) }).click();
    await expect(page.getByTestId("simulation-phase")).toContainText("Xem thử");
    expect(
      await page.locator(".kpis .kpi").first().textContent(),
    ).not.toContain("34,56MW");
    await page
      .getByLabel("Tốc độ phát lại", { exact: true })
      .selectOption("15");
    await picker
      .getByRole("button", { name: "Chạy mô phỏng", exact: true })
      .click();
    await expect(page.getByTestId("simulation-phase")).toHaveText(
      "Hoàn thành",
      { timeout: 15000 },
    );
    await expect(
      picker.getByRole("button", { name: "Chạy lại mô phỏng" }),
    ).toBeVisible();
  }
  await picker.getByRole("button", { name: /Bám bụi/ }).click();
  await picker
    .getByRole("button", { name: "Tùy chọn nâng cao", exact: true })
    .click();
  await page.getByLabel("Thời đoạn đánh giá").fill("5");
  if (
    !(await page
      .locator(".simulation-advanced")
      .evaluate((el) => (el as HTMLDetailsElement).open))
  ) {
    await page.locator(".simulation-advanced > summary").click();
  }
  await page.getByLabel("Thử phương án vệ sinh", { exact: true }).check();
  await page
    .getByLabel("Thời điểm hoàn tất phương án", { exact: true })
    .fill("2");
  await expect(page.getByTestId("recoverable-energy")).not.toHaveText("0 MWh");
  await picker
    .getByRole("button", { name: "Chạy mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("simulation-phase")).toHaveText("Hoàn thành");
  await page.getByRole("button", { name: "Có phương án", exact: true }).click();
  await expect(page.locator(".kpis .kpi").first()).toContainText("34,56");
  await page.screenshot({
    path: "test-results/t02-comparison.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Chưa xử lý", exact: true }).click();
  await expect(page.locator(".kpis .kpi").first()).toContainText("33,7");
  // Measure browser event-to-KPI update, excluding Playwright scrolling latency.
  await page.evaluate(() => {
    const range =
      document.querySelector<HTMLInputElement>(
        'input[aria-label="Mức giảm công suất"]',
      ) ??
      Array.from(document.querySelectorAll("input[type=range]")).find((el) =>
        el.closest("label")?.textContent?.includes("Mức giảm công suất"),
      )!;
    range.addEventListener(
      "input",
      () => {
        const start = performance.now();
        const observer = new MutationObserver(() => {
          document.body.dataset.parameterLatency = String(
            performance.now() - start,
          );
          observer.disconnect();
        });
        observer.observe(document.querySelector(".kpis")!, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      },
      { once: true, capture: true },
    );
  });
  await page.getByLabel("Mức giảm công suất").fill("35");
  await expect(page.getByTestId("simulation-phase")).toContainText("Xem thử");
  await expect(page.getByTestId("run-time")).toContainText("phút 0/5");
  await expect(page.locator("body")).toHaveAttribute(
    "data-parameter-latency",
    /\d/,
  );
  const latency = Number(
    await page.locator("body").getAttribute("data-parameter-latency"),
  );
  console.log(`Parameter input-to-KPI latency: ${latency.toFixed(1)} ms`);
  expect(latency).toBeLessThan(300);
  expect(await canvas.getAttribute("data-camera-position")).toBe(camera);
  await page.getByLabel("Tốc độ phát lại", { exact: true }).selectOption("1");
  await picker
    .getByRole("button", { name: "Chạy mô phỏng", exact: true })
    .click();
  await picker.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await expect(page.getByTestId("simulation-phase")).toHaveText("Tạm dừng");
  const time = await page.getByTestId("run-time").textContent();
  await page.waitForTimeout(1200);
  expect(await page.getByTestId("run-time").textContent()).toBe(time);
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis .kpi").first()).toContainText("34,56");
  await expect(page.locator(".hud-status")).toHaveText("Bình thường");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await expect(page.getByTestId("simulation-phase")).toHaveText("Tạm dừng");
  await picker
    .getByRole("button", { name: "Đặt lại mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("run-time")).toContainText("phút 0/30");
  await expect(page.locator(".kpis .kpi").first()).toContainText("34,56");
  await page.screenshot({ path: "test-results/t02-reset.png" });
});

test("Mobile comparison controls and projections remain usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  await page
    .getByRole("region", { name: "Chọn kịch bản mô phỏng" })
    .getByRole("button", { name: /Bám bụi/ })
    .click();
  if (
    !(await page
      .locator(".simulation-advanced")
      .evaluate((el) => (el as HTMLDetailsElement).open))
  ) {
    await page.locator(".simulation-advanced > summary").click();
  }
  await page.getByLabel("Thử phương án vệ sinh", { exact: true }).check();
  await page.getByRole("button", { name: "Có phương án", exact: true }).click();
  await expect(page.getByTestId("recoverable-energy")).not.toHaveText("0 MWh");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/t02-mobile-comparison.png",
    fullPage: true,
  });
});

test("Scale controls the same affected assets, energy loss and 3D scope", () => {
  for (const kind of ["cloud", "dust", "fault"] as const) {
    const one = createSession({ ...presetConfig(kind), scale: 1 });
    const four = createSession({ ...presetConfig(kind), scale: 4 });
    expect(forecast(four.config).lossMWh).toBeCloseTo(
      4 * forecast(one.config).lossMWh,
    );
    expect(
      four.untreated.assets.filter((a) => a.type === "pv" && a.scenario),
    ).toHaveLength(4);
    expect(four.untreated.availability).toBe(kind === "fault" ? 50 : 100);
  }
  expect(normalizeConfig({ ...presetConfig("dust"), scale: 99 }).scale).toBe(8);
  expect(() =>
    normalizeConfig({ ...presetConfig("cloud"), scale: NaN }),
  ).toThrow();
});

test("Simple flow exposes scenario, scale, duration and impact before any advanced controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Mô phỏng", exact: true }).click();
  const picker = page.getByRole("region", { name: "Chọn kịch bản mô phỏng" });
  await expect(
    picker.getByRole("button", { name: "Chạy mô phỏng", exact: true }),
  ).toBeDisabled();
  await picker.getByRole("button", { name: /Mây che/ }).click();
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("2");
  await page
    .getByLabel("Thời gian ảnh hưởng", { exact: true })
    .selectOption("15");
  await expect(page.getByTestId("power-reduction")).toContainText("3,89 MW");
  await expect(page.getByTestId("simple-energy-loss")).toHaveText("0,97 MWh");
  await expect(
    page.getByLabel("Tốc độ phát lại", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByLabel("Thử phương án vệ sinh", { exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(async () =>
      JSON.parse(
        (await page.locator("canvas").getAttribute("data-cloud-assets")) ??
          "[]",
      ),
    )
    .toEqual(["PV-01", "PV-02"]);
  await picker.getByRole("button", { name: /Lỗi inverter/ }).click();
  await page.getByLabel("Quy mô ảnh hưởng", { exact: true }).selectOption("8");
  await expect(page.getByTestId("power-reduction")).toContainText("34,56 MW");
  await expect(page.locator(".kpis .kpi").first()).toContainText("0MW");
  await picker
    .getByRole("button", { name: "Chạy mô phỏng", exact: true })
    .click();
  await expect(page.getByTestId("simulation-phase")).toHaveText("Đang chạy");
  await page.screenshot({
    path: "test-results/simple-simulation.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Hiện trạng", exact: true }).click();
  await expect(page.locator(".kpis .kpi").first()).toContainText("34,56");
});
