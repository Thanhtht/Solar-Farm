import { hongLiemFields } from "../data/hong-liem-layout";

export const hongLiemPlant = {
  id: "hong-liem-3",
  name: "Hồng Liêm 3",
  dcMWp: 50,
  acMW: 40,
  source: "Dữ liệu giả định · Hình học ước lượng từ ảnh",
  fixtureTime: "11/11/2026 · 10:30 ICT",
};
export type HongLiemScenario = "none" | "cloud" | "dust" | "fault";
export type HongLiemConfig = {
  scenario: HongLiemScenario;
  target: string;
  irradiance: number;
  durationHours: number;
};
export const initialHongLiemConfig: HongLiemConfig = {
  scenario: "none",
  target: "all",
  irradiance: 780,
  durationHours: 1,
};
const rowCount = hongLiemFields.reduce((s, field) => s + field.rows.length, 0);

export function createHongLiemSnapshot(
  config: HongLiemConfig = initialHongLiemConfig,
) {
  // Representative region capacities are proportional to the drawn PV area.
  // 50 MWp is public project information; AC sizing/telemetry are demo inputs.
  const irradiance = Math.min(
    1100,
    Math.max(0, Number.isFinite(config.irradiance) ? config.irradiance : 780),
  );
  const durationHours = Math.min(
    24,
    Math.max(
      1,
      Number.isFinite(config.durationHours) ? config.durationHours : 1,
    ),
  );
  const cellTemperature = 28 + irradiance * 0.024;
  const thermalFactor = Math.max(0, 1 - 0.004 * (cellTemperature - 25));
  const fields = hongLiemFields.map((field, index) => {
    const dcMWp = (hongLiemPlant.dcMWp * field.rows.length) / rowCount;
    const acLimitMW = (hongLiemPlant.acMW * field.rows.length) / rowCount;
    const baseFactor = index === 3 ? 0.97 : 1;
    const baselineDC = dcMWp * (irradiance / 1000) * thermalFactor * baseFactor;
    const referenceMW = Math.min(acLimitMW, baselineDC * 0.97);
    const affected =
      (config.target === "all" || config.target === field.id) &&
      config.scenario !== "none";
    const factor = affected
      ? config.scenario === "fault"
        ? 0
        : config.scenario === "cloud"
          ? 0.65
          : 0.85
      : 1;
    const powerMW = Math.min(acLimitMW, baselineDC * factor * 0.97);
    return {
      id: field.id,
      name: field.name,
      dcMWp,
      acLimitMW,
      powerMW,
      dcPowerMW: powerMW / 0.97,
      referenceMW,
      lossMW: referenceMW - powerMW,
      energyMWh: powerMW * durationHours,
      lossMWh: (referenceMW - powerMW) * durationHours,
      temperature: cellTemperature + (index === 3 ? 3 : 0),
      irradiance:
        irradiance * (affected && config.scenario === "cloud" ? 0.65 : 1),
      status:
        affected && config.scenario === "fault"
          ? ("stopped" as const)
          : affected || index === 3
            ? ("degraded" as const)
            : ("normal" as const),
      connected: true,
      inverterId: `HL3-INV-${String(index + 1).padStart(2, "0")}`,
      rows: field.rows.length,
    };
  });
  return {
    fields,
    irradiance,
    durationHours,
    cellTemperature,
    powerMW: fields.reduce((s, f) => s + f.powerMW, 0),
    referenceMW: fields.reduce((s, f) => s + f.referenceMW, 0),
    energyMWh: fields.reduce((s, f) => s + f.energyMWh, 0),
    lossMWh: fields.reduce((s, f) => s + f.lossMWh, 0),
    availability:
      (100 * fields.filter((f) => f.status !== "stopped").length) /
      fields.length,
    scenario: config.scenario,
  };
}
export type HongLiemSnapshot = ReturnType<typeof createHongLiemSnapshot>;
