import { assets as registry, type Asset, type Signal } from "../data/plant";
export const baseline = {
  start: "2026-11-02T03:30:00.000Z",
  stepSeconds: 60,
  seed: 1,
  dcMWp: 50,
  acLimitMW: 40,
  irradiance: 780,
  referenceIrradiance: 1000,
  dcDerating: 12 / 13,
  efficiency: 0.96,
  inverterLimitMW: 5,
  pvWarning: 55,
  inverterCritical: 70,
  staleSeconds: 120,
} as const;
export type Sample = {
  value: number | null;
  quality: Signal["quality"];
  sampledAt: string;
};
export type Fixtures = {
  dcFactors?: Record<string, number>;
  signals?: Record<string, Partial<Sample>>;
  faults?: string[];
  offline?: string[];
};
export type Run = {
  id: string;
  revision: number;
  seed: number;
  step: number;
  running: boolean;
  energyMWh: number;
  assets: Asset[];
  times: string[];
  powerHistory: (number | null)[];
  powerMW: number | null;
  modelPowerMW: number;
  dcMW: number;
  availability: number;
  missingInverters: number;
  lossMWh: number;
  sampledAt: string;
};
export function quality(sample: Sample, now: string): Signal["quality"] {
  if (sample.value === null) return "missing";
  if (!Number.isFinite(sample.value) || sample.quality === "invalid")
    return "invalid";
  return Date.parse(now) - Date.parse(sample.sampledAt) >
    baseline.staleSeconds * 1000
    ? "stale"
    : sample.quality;
}
export function generate(
  id: string,
  revision: number,
  step: number,
  fixtures: Fixtures = {},
  previous?: Run,
): Run {
  const sampledAt = new Date(
    Date.parse(baseline.start) + step * 60000,
  ).toISOString();
  const dc =
    (((baseline.dcMWp / 8) * baseline.irradiance) /
      baseline.referenceIrradiance) *
    baseline.dcDerating;
  const ac = Math.min(baseline.inverterLimitMW, dc * baseline.efficiency);
  const faults = [...new Set(fixtures.faults ?? [])].filter((id) =>
    registry.some((a) => a.id === id && a.type === "inverter"),
  );
  const inverterIds = registry
    .filter((a) => a.type === "inverter")
    .map((a) => a.id);
  const factor = (id: string) =>
    faults.includes(id)
      ? 0
      : Math.max(0, Math.min(1, fixtures.dcFactors?.[id] ?? 1));
  const modelPowerMW = Math.min(
    baseline.acLimitMW,
    inverterIds.reduce(
      (sum, id) =>
        sum +
        Math.min(
          baseline.inverterLimitMW,
          dc * factor(id) * baseline.efficiency,
        ),
      0,
    ),
  );
  const assets = registry.map((asset): Asset => {
    const inverterId = asset.type === "pv" ? asset.related[0] : asset.id;
    const localDC = dc * factor(inverterId);
    const localAC = Math.min(
      baseline.inverterLimitMW,
      localDC * baseline.efficiency,
    );
    const fault = faults.includes(asset.id);
    const signals = asset.signals.map((signal): Signal => {
      const key = signal.id.split(".")[1];
      let value = signal.value;
      if (key === "pdc") value = localDC;
      if (key === "idc") value = (localDC * 1e6) / 1000;
      if (key === "pac") value = fault ? 0 : localAC;
      if (key === "fault") value = fault ? 1 : 0;
      if (key === "power") value = modelPowerMW;
      const sample: Sample = {
        value,
        quality: "valid",
        sampledAt,
        ...fixtures.signals?.[signal.id],
      };
      sample.quality = quality(sample, sampledAt);
      const usable = sample.quality === "valid";
      const old = previous?.assets
        .find((a) => a.id === asset.id)
        ?.signals.find((s) => s.id === signal.id);
      return {
        ...signal,
        ...sample,
        snapshotId: id,
        revision,
        history: [...(old?.history ?? []), usable ? sample.value : null],
      };
    });
    const temp = signals.find(
      (s) => s.id.endsWith(".temp") && s.quality === "valid",
    );
    const level =
      asset.type === "inverter" &&
      (temp?.value ?? 0) >= baseline.inverterCritical
        ? "critical"
        : asset.type === "pv" && (temp?.value ?? 0) >= baseline.pvWarning
          ? "warning"
          : undefined;
    return {
      ...asset,
      signals,
      sampledAt,
      heartbeatAt: fixtures.offline?.includes(asset.id)
        ? (previous?.assets.find((a) => a.id === asset.id)?.heartbeatAt ??
          baseline.start)
        : sampledAt,
      snapshotId: id,
      revision,
      connection: fixtures.offline?.includes(asset.id)
        ? "Mất kết nối"
        : "Đang kết nối",
      operation: fault
        ? "Sự cố"
        : level === "critical"
          ? "Cảnh báo"
          : level
            ? "Lưu ý"
            : "Bình thường",
      attention: fault
        ? {
            level: "critical",
            reason: "Inverter lỗi nhưng telemetry vẫn độc lập",
            signalId: `${asset.id}.fault`,
          }
        : level
          ? {
              level,
              reason:
                asset.type === "pv"
                  ? "Nhiệt độ module tăng"
                  : "Nhiệt độ bên trong cao",
              signalId: temp!.id,
            }
          : undefined,
    };
  });
  const powers = assets
    .filter((a) => a.type === "inverter")
    .map((a) => a.signals[0]);
  const missingInverters = powers.filter((s) => s.quality !== "valid").length;
  const powerMW = missingInverters
    ? null
    : powers.reduce((sum, s) => sum + s.value!, 0);
  const transformer = assets.find((a) => a.id === "TR-01")!.signals[0];
  transformer.value = powerMW;
  transformer.quality = missingInverters ? "missing" : "valid";
  transformer.history[transformer.history.length - 1] = powerMW;
  return {
    id,
    revision,
    seed: baseline.seed,
    step,
    running: previous?.running ?? false,
    sampledAt,
    assets,
    times: [...(previous?.times ?? []), sampledAt],
    powerHistory: [...(previous?.powerHistory ?? []), powerMW],
    powerMW,
    modelPowerMW,
    dcMW: inverterIds.reduce((sum, id) => sum + dc * factor(id), 0),
    missingInverters,
    availability: ((8 - faults.length) / 8) * 100,
    energyMWh:
      (previous?.energyMWh ?? 0) +
      (previous ? (previous.modelPowerMW + modelPowerMW) / 2 / 60 : 0),
    lossMWh: 0,
  };
}
export function createRun(revision = 1): Run {
  return generate(`baseline-${revision}`, revision, 0);
}
export function transition(
  run: Run,
  action: "play" | "pause" | "tick" | "reset",
): Run {
  if (action === "reset") return createRun(run.revision + 1);
  if (action === "play" || action === "pause")
    return { ...run, running: action === "play" };
  return run.running
    ? generate(run.id, run.revision, run.step + 1, {}, run)
    : run;
}
export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
