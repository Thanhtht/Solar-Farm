import {
  assets as registry,
  scenarios,
  type Asset,
  type ScenarioId,
} from "../data/plant";
import { baseline, generate, type Run, type Fixtures } from "./simulation";
export type Config = {
  kind: ScenarioId | null;
  target: string;
  severity: number;
  duration: number;
  intervention: boolean;
  interventionMinute: number;
  recovery: number;
};
export type Session = {
  config: Config;
  revision: number;
  phase: "preview" | "running" | "paused" | "complete";
  elapsed: number;
  base: Run;
  untreated: Run;
  treated: Run;
};
export const defaultConfig: Config = {
  kind: null,
  target: "INV-01",
  severity: 45,
  duration: 30,
  intervention: false,
  interventionMinute: 15,
  recovery: 100,
};
const dcPerInverter =
  (((baseline.dcMWp / 8) * baseline.irradiance) /
    baseline.referenceIrradiance) *
  baseline.dcDerating;
const inverterPower = Math.min(
  baseline.inverterLimitMW,
  dcPerInverter * baseline.efficiency,
);
export const basePower = Math.min(baseline.acLimitMW, inverterPower * 8);
const inverterIds = registry
  .filter((a) => a.type === "inverter")
  .map((a) => a.id);
function bounded(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) throw new Error("Tham số phải là số hữu hạn");
  return Math.max(min, Math.min(max, value));
}
export function normalizeConfig(config: Config): Config {
  if (config.kind !== null && !scenarios.some((s) => s.id === config.kind))
    throw new Error("Kịch bản không hợp lệ");
  if (![...inverterIds, "all"].includes(config.target))
    throw new Error("Thiết bị không hợp lệ");
  const duration = Math.round(bounded(config.duration, 5, 120));
  return {
    ...config,
    duration,
    severity:
      config.kind === "fault"
        ? 100
        : bounded(config.severity, 0, config.kind === "dust" ? 50 : 100),
    intervention:
      config.kind !== "cloud" && config.kind !== null && config.intervention,
    interventionMinute: Math.round(
      bounded(config.interventionMinute, 0, duration),
    ),
    recovery: bounded(config.recovery, 0, 100),
  };
}
export function presetConfig(
  kind: ScenarioId,
  previous: Config = defaultConfig,
): Config {
  const preset = scenarios.find((s) => s.id === kind)!;
  return normalizeConfig({
    ...previous,
    kind,
    severity: preset.severity,
    duration: preset.duration,
    intervention: false,
    interventionMinute: Math.floor(preset.duration / 2),
    recovery: 100,
  });
}
export function effects(
  config: Config,
  minute: number,
  treated: boolean,
): Fixtures {
  if (!config.kind || (config.kind === "cloud" && minute >= config.duration))
    return {};
  const targets =
    config.kind === "cloud"
      ? registry
          .filter((a) => a.type === "pv" && a.position[0] < 0)
          .map((a) => a.related[0])
      : config.target === "all"
        ? inverterIds
        : [config.target];
  const recovered =
    treated && config.intervention && minute >= config.interventionMinute;
  if (config.kind === "fault") return { faults: recovered ? [] : targets };
  const reduction =
    (config.severity / 100) * (recovered ? 1 - config.recovery / 100 : 1);
  return {
    dcFactors: Object.fromEntries(targets.map((id) => [id, 1 - reduction])),
  };
}
export function powerAt(config: Config, minute: number, treated = false) {
  const input = effects(config, minute, treated);
  return inverterIds.reduce(
    (sum, id) =>
      sum +
      (input.faults?.includes(id)
        ? 0
        : Math.min(
            baseline.inverterLimitMW,
            dcPerInverter * baseline.efficiency * (input.dcFactors?.[id] ?? 1),
          )),
    0,
  );
}
export function forecast(input: Config) {
  const config = normalizeConfig(input);
  let untreated = 0,
    treated = 0;
  for (let minute = 0; minute < config.duration; minute++) {
    untreated += powerAt(config, minute) / 60;
    treated += powerAt(config, minute, true) / 60;
  }
  const base = (basePower * config.duration) / 60;
  return {
    baseMWh: base,
    untreatedMWh: untreated,
    treatedMWh: treated,
    lossMWh: Math.max(0, base - untreated),
    recoveredMWh: Math.max(0, treated - untreated),
  };
}
function frame(
  config: Config,
  revision: number,
  minute: number,
  layer: "base" | "untreated" | "treated",
  previous?: Run,
): Run {
  const input =
    layer === "base" ? {} : effects(config, minute, layer === "treated");
  const run = generate(
    `scenario-${revision}-${layer}`,
    revision,
    minute,
    input,
    previous,
  );
  // Minute samples are piecewise constant on [minute, minute+1). Integrate the
  // preceding interval, preserving exact jumps at failures, repairs and cloud exit.
  run.energyMWh =
    (previous?.energyMWh ?? 0) + (previous ? previous.modelPowerMW / 60 : 0);
  run.lossMWh = Math.max(0, (basePower * minute) / 60 - run.energyMWh);
  run.running = false;
  if (layer !== "base" && config.kind)
    run.assets = run.assets.map((asset): Asset => {
      const inverterId = asset.type === "pv" ? asset.related[0] : asset.id;
      const fault = input.faults?.includes(inverterId);
      const reduced = (input.dcFactors?.[inverterId] ?? 1) < 1;
      if (!fault && !reduced) return asset;
      const label = fault
        ? asset.type === "pv"
          ? "Ảnh hưởng lỗi inverter"
          : "Lỗi inverter"
        : config.kind === "cloud"
          ? "Mây che · suy giảm"
          : "Bám bụi · suy giảm";
      return {
        ...asset,
        operation: fault && asset.type === "inverter" ? "Sự cố" : "Suy giảm",
        scenario: {
          kind: config.kind!,
          label,
          level: fault ? "critical" : "warning",
          reason: fault
            ? "Inverter mất đầu ra; telemetry vẫn đang kết nối."
            : `Công suất vùng giảm ${(100 * (1 - (input.dcFactors?.[inverterId] ?? 1))).toFixed(0)}% theo mô hình.`,
        },
      };
    });
  return run;
}
export function createSession(
  input: Config = defaultConfig,
  revision = 1,
): Session {
  const config = normalizeConfig(input);
  return {
    config,
    revision,
    phase: "preview",
    elapsed: 0,
    base: frame(config, revision, 0, "base"),
    untreated: frame(config, revision, 0, "untreated"),
    treated: frame(config, revision, 0, "treated"),
  };
}
export function sessionAction(
  session: Session,
  action: "play" | "pause" | "tick" | "restart" | "reset",
): Session {
  if (action === "reset")
    return createSession(defaultConfig, session.revision + 1);
  if (action === "restart")
    return {
      ...createSession(session.config, session.revision + 1),
      phase: "running",
    };
  if (action === "pause")
    return session.phase === "running"
      ? { ...session, phase: "paused" }
      : session;
  if (action === "play")
    return session.phase === "complete"
      ? sessionAction(session, "restart")
      : { ...session, phase: "running" };
  if (session.phase !== "running") return session;
  const elapsed = Math.min(session.config.duration, session.elapsed + 1);
  return {
    ...session,
    elapsed,
    phase: elapsed === session.config.duration ? "complete" : "running",
    base: frame(
      session.config,
      session.revision,
      elapsed,
      "base",
      session.base,
    ),
    untreated: frame(
      session.config,
      session.revision,
      elapsed,
      "untreated",
      session.untreated,
    ),
    treated: frame(
      session.config,
      session.revision,
      elapsed,
      "treated",
      session.treated,
    ),
  };
}
