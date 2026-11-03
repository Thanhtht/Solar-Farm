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
  scale?: number;
  severity: number;
  duration: number;
  intervention: boolean;
  interventionMinute: number;
  recovery: number;
};
export type Session = {
  initial?: Run;
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
export const referencePower = (initial?: Run) =>
  initial?.modelPowerMW ?? basePower;

function initialFixtures(initial?: Run): Fixtures {
  if (!initial) return {};
  return {
    faults: initial.assets
      .filter(
        (asset) =>
          asset.type === "inverter" &&
          asset.signals.some(
            (signal) =>
              signal.id.endsWith(".fault") &&
              signal.quality === "valid" &&
              (signal.value ?? 0) > 0,
          ),
      )
      .map((asset) => asset.id),
    dcFactors: Object.fromEntries(
      initial.assets
        .filter((asset) => asset.type === "pv")
        .map((asset) => [
          asset.related[0],
          (asset.signals.find((signal) => signal.id.endsWith(".pdc"))?.value ??
            0) / dcPerInverter,
        ]),
    ),
    signals: Object.fromEntries(
      initial.assets.flatMap((asset) =>
        asset.signals
          .filter((signal) => !/\.(pdc|idc|pac|fault|power)$/.test(signal.id))
          .map((signal) => [
            signal.id,
            { value: signal.value, quality: signal.quality },
          ]),
      ),
    ),
  };
}
function combineEffects(source: Fixtures, effect: Fixtures): Fixtures {
  return {
    signals: source.signals,
    faults: [...new Set([...(source.faults ?? []), ...(effect.faults ?? [])])],
    dcFactors: Object.fromEntries(
      inverterIds.map((id) => [
        id,
        (source.dcFactors?.[id] ?? 1) * (effect.dcFactors?.[id] ?? 1),
      ]),
    ),
  };
}
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
  const duration = Math.round(bounded(config.duration, 5, 1440));
  return {
    ...config,
    duration,
    scale: Math.round(
      bounded(
        config.scale ??
          (config.kind === "cloud" ? 4 : config.target === "all" ? 8 : 1),
        1,
        8,
      ),
    ),
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
    scale: kind === "cloud" ? 4 : 1,
    severity: preset.severity,
    duration: preset.duration,
    intervention: false,
    interventionMinute: Math.floor(preset.duration / 2),
    recovery: 100,
  });
}
export function affectedInverters(config: Config): string[] {
  if (config.target === "all") return inverterIds;
  const order =
    config.kind === "cloud"
      ? [
          "INV-01",
          "INV-02",
          "INV-05",
          "INV-06",
          "INV-03",
          "INV-04",
          "INV-07",
          "INV-08",
        ]
      : config.target === "all"
        ? inverterIds
        : [config.target, ...inverterIds.filter((id) => id !== config.target)];
  return order.slice(
    0,
    config.target === "all" && config.scale === undefined
      ? 8
      : (config.scale ?? (config.kind === "cloud" ? 4 : 1)),
  );
}
export function effects(
  config: Config,
  minute: number,
  treated: boolean,
): Fixtures {
  if (!config.kind || (config.kind === "cloud" && minute >= config.duration))
    return {};
  const targets = affectedInverters(config);
  const recovered =
    treated && config.intervention && minute >= config.interventionMinute;
  if (config.kind === "fault") return { faults: recovered ? [] : targets };
  const reduction =
    (config.severity / 100) * (recovered ? 1 - config.recovery / 100 : 1);
  return {
    dcFactors: Object.fromEntries(targets.map((id) => [id, 1 - reduction])),
  };
}
function powerFrom(input: Fixtures) {
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
export function powerAt(
  config: Config,
  minute: number,
  treated = false,
  initial?: Run,
) {
  return powerFrom(
    combineEffects(initialFixtures(initial), effects(config, minute, treated)),
  );
}
export function forecast(input: Config, initial?: Run) {
  const config = normalizeConfig(input);
  const source = initialFixtures(initial);
  let untreated = 0,
    treated = 0;
  for (let minute = 0; minute < config.duration; minute++) {
    untreated +=
      powerFrom(combineEffects(source, effects(config, minute, false))) / 60;
    treated +=
      powerFrom(combineEffects(source, effects(config, minute, true))) / 60;
  }
  const base = (referencePower(initial) * config.duration) / 60;
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
  initial?: Run,
): Run {
  const effect =
    layer === "base" ? {} : effects(config, minute, layer === "treated");
  const source = initialFixtures(initial);
  const input = combineEffects(source, effect);
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
  run.lossMWh = Math.max(
    0,
    (referencePower(initial) * minute) / 60 - run.energyMWh,
  );
  run.running = false;
  if (initial) {
    run.assets = run.assets.map((asset) => {
      const original = initial.assets.find((item) => item.id === asset.id)!;
      return {
        ...asset,
        operation: original.operation,
        attention: original.attention ? { ...original.attention } : undefined,
        monitoringIssue: original.monitoringIssue
          ? structuredClone(original.monitoringIssue)
          : undefined,
        signals: asset.signals.map((signal) => {
          const old = original.signals.find((item) => item.id === signal.id)!;
          return minute === 0
            ? {
                ...signal,
                history: [...old.history.slice(0, -1), signal.value],
                historyTimes: [...initial.times.slice(0, -1), run.sampledAt],
              }
            : signal;
        }),
      };
    });
    if (minute === 0) {
      run.times = [...initial.times];
      run.powerHistory = [...initial.powerHistory.slice(0, -1), run.powerMW];
    }
  }
  if (layer !== "base" && config.kind)
    run.assets = run.assets.map((asset): Asset => {
      const inverterId = asset.type === "pv" ? asset.related[0] : asset.id;
      const fault = effect.faults?.includes(inverterId);
      const reduced = (effect.dcFactors?.[inverterId] ?? 1) < 1;
      if (!fault && !reduced) return asset;
      const label = fault
        ? asset.type === "pv"
          ? "Ảnh hưởng lỗi inverter"
          : "Lỗi inverter"
        : config.kind === "cloud"
          ? "Mây che · suy giảm"
          : "Bám bụi · suy giảm";
      const alreadyStopped = source.faults?.includes(inverterId);
      return {
        ...asset,
        attention: asset.attention
          ? {
              ...asset.attention,
              reason: `Vấn đề có sẵn trước kịch bản: ${asset.attention.reason}`,
            }
          : undefined,
        operation: alreadyStopped
          ? asset.operation
          : fault && asset.type === "inverter"
            ? "Sự cố"
            : "Suy giảm",
        scenario: {
          kind: config.kind!,
          label: alreadyStopped ? `${label} · đã dừng từ đầu` : label,
          level: fault ? "critical" : "warning",
          reason: alreadyStopped
            ? "Nhánh đã dừng ở trạng thái ban đầu; kịch bản không tạo thêm tổn thất trên nhánh này."
            : fault
              ? "Inverter mất đầu ra; kết nối IoT trong mô phỏng vẫn bình thường."
              : `Công suất vùng giảm ${(100 * (1 - (effect.dcFactors?.[inverterId] ?? 1))).toFixed(0)}% so với trạng thái ban đầu.`,
        },
      };
    });
  return run;
}
export function createSession(
  input: Config = defaultConfig,
  revision = 1,
  initial?: Run,
): Session {
  const config = normalizeConfig(input);
  const source = initial ? structuredClone(initial) : undefined;
  return {
    initial: source,
    config,
    revision,
    phase: "preview",
    elapsed: 0,
    base: frame(config, revision, 0, "base", undefined, source),
    untreated: frame(config, revision, 0, "untreated", undefined, source),
    treated: frame(config, revision, 0, "treated", undefined, source),
  };
}
export function sessionAction(
  session: Session,
  action: "play" | "pause" | "tick" | "restart" | "reset",
): Session {
  if (action === "reset")
    return createSession(defaultConfig, session.revision + 1, session.initial);
  if (action === "restart")
    return {
      ...createSession(session.config, session.revision + 1, session.initial),
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
      session.initial,
    ),
    untreated: frame(
      session.config,
      session.revision,
      elapsed,
      "untreated",
      session.untreated,
      session.initial,
    ),
    treated: frame(
      session.config,
      session.revision,
      elapsed,
      "treated",
      session.treated,
      session.initial,
    ),
  };
}
