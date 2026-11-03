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
