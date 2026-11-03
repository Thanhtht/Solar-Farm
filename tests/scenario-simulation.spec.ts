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
      duration: 99999,
      recovery: 200,
      interventionMinute: 99999,
    }),
  ).toMatchObject({
    severity: 50,
    duration: 1440,
    recovery: 100,
    interventionMinute: 1440,
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

test("Hour horizons retain exact energy and bound the longest UI option", () => {
  const one = { ...presetConfig("fault"), duration: 60 };
  expect(forecast({ ...one, duration: 120 }).lossMWh).toBeCloseTo(
    2 * forecast(one).lossMWh,
  );
  expect(forecast({ ...one, scale: 8, duration: 1440 }).lossMWh).toBeCloseTo(
    829.44,
  );
  expect(normalizeConfig({ ...one, duration: 99999 }).duration).toBe(1440);
});
