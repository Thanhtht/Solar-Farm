import {
  getPlantProfile,
  branchRating,
  type PlantId,
} from "../data/plant-profiles";
import { scenarios, type Asset, type ScenarioId } from "../data/plant";
import { baseline, generate, type Run, type Fixtures } from "./simulation";
export type Config = {
  plantId?: PlantId;
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

const idsFor = (plantId?: PlantId) =>
  getPlantProfile(plantId)
    .assets.filter((a) => a.type === "inverter")
    .map((a) => a.id);
const dcFor = (id: string, plantId?: PlantId) =>
  ((branchRating(id, plantId).dcMWp * baseline.irradiance) /
    baseline.referenceIrradiance) *
  baseline.dcDerating;
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
        .filter((a) => a.type === "inverter")
        .map((inv) => [
          inv.id,
          initial.assets
            .filter((a) => a.type === "pv" && a.related.includes(inv.id))
            .reduce(
              (sum, a) =>
                sum +
                (a.signals.find((s) => s.id.endsWith(".pdc"))?.value ?? 0),
              0,
            ) / dcFor(inv.id, initial.plantId),
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
function combineEffects(
  source: Fixtures,
  effect: Fixtures,
  plantId?: PlantId,
): Fixtures {
  return {
    signals: source.signals,
    faults: [...new Set([...(source.faults ?? []), ...(effect.faults ?? [])])],
    dcFactors: Object.fromEntries(
      idsFor(plantId).map((id) => [
        id,
        (source.dcFactors?.[id] ?? 1) * (effect.dcFactors?.[id] ?? 1),
      ]),
    ),
  };
}
function bounded(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) throw new Error("Tham số phải là số hữu hạn");
  return Math.max(min, Math.min(max, value));
}
export function normalizeConfig(config: Config): Config {
  const inverterIds = idsFor(config.plantId);
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
          (config.kind === "cloud"
            ? 4
            : config.target === "all"
              ? inverterIds.length
              : 1),
        1,
        inverterIds.length,
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
  const inverterIds = idsFor(config.plantId);
  if (config.target === "all") return inverterIds;
  const order =
    config.kind === "cloud" && (config.plantId ?? "sava") === "sava"
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
  const spatialOrder =
    config.kind === "cloud" &&
    config.plantId !== undefined &&
    config.plantId !== "sava"
      ? getPlantProfile(config.plantId)
          .assets.filter((a) => a.type === "pv")
          .sort((a, b) => a.position[0] - b.position[0])
          .map((a) => a.related[0])
          .filter((id, i, ids) => ids.indexOf(id) === i)
      : order;
  return spatialOrder.slice(
    0,
    config.target === "all" && config.scale === undefined
      ? inverterIds.length
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
function powerFrom(input: Fixtures, plantId?: PlantId) {
  return idsFor(plantId).reduce(
    (sum, id) =>
      sum +
      (input.faults?.includes(id)
        ? 0
        : Math.min(
            branchRating(id, plantId).acMW,
            dcFor(id, plantId) *
              baseline.efficiency *
              (input.dcFactors?.[id] ?? 1),
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
  if (config.plantId && initial?.plantId && config.plantId !== initial.plantId)
    throw new Error("Nguồn dữ liệu khác nhà máy");
  config = { ...config, plantId: config.plantId ?? initial?.plantId };
  return powerFrom(
    combineEffects(
      initialFixtures(initial),
      effects(config, minute, treated),
      config.plantId,
    ),
    config.plantId,
  );
}
export function forecast(input: Config, initial?: Run) {
  if (input.plantId && initial?.plantId && input.plantId !== initial.plantId)
    throw new Error("Nguồn dữ liệu khác nhà máy");
  const config = normalizeConfig({
    ...input,
    ...(initial?.plantId && initial.plantId !== "sava"
      ? { plantId: initial.plantId }
      : {}),
  });
  const source = initialFixtures(initial);
  let untreated = 0,
    treated = 0;
  for (let minute = 0; minute < config.duration; minute++) {
    untreated +=
      powerFrom(
        combineEffects(source, effects(config, minute, false), config.plantId),
        config.plantId,
      ) / 60;
    treated +=
      powerFrom(
        combineEffects(source, effects(config, minute, true), config.plantId),
        config.plantId,
      ) / 60;
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
  const input = combineEffects(source, effect, config.plantId);
  const run = generate(
    `scenario-${revision}-${layer}`,
    revision,
    minute,
    input,
    previous,
    config.plantId,
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
        operatingState: original.operatingState,
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
      const stopped = asset.signals.some(
        (signal) =>
          /\.(pdc|pac)$/.test(signal.id) &&
          signal.quality === "valid" &&
          signal.value === 0,
      );
      return {
        ...asset,
        operatingState: stopped ? "stopped" : "degraded",
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
          level: stopped ? "critical" : "warning",
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
  if (input.plantId && initial?.plantId && input.plantId !== initial.plantId)
    throw new Error("Nguồn dữ liệu khác nhà máy");
  const config = normalizeConfig({
    ...input,
    ...(initial?.plantId && initial.plantId !== "sava"
      ? { plantId: initial.plantId }
      : {}),
  });
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
    return createSession(
      { ...defaultConfig, plantId: session.config.plantId },
      session.revision + 1,
      session.initial,
    );
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
