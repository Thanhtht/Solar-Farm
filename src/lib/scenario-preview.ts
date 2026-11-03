import type { Asset, ScenarioId } from "../data/plant";

// Preview annotations never overwrite measured/modelled operation or telemetry.
export function scenarioAssets(
  assets: Asset[],
  scenario: ScenarioId | null,
  target: string,
  severity: number,
): Asset[] {
  return assets.map((asset) => {
    const { preview: _previous, ...base } = asset;
    if (!scenario || (scenario !== "fault" && severity <= 0)) return base;
    const affected =
      scenario === "cloud"
        ? asset.type === "pv" && asset.position[0] < 0
        : asset.id === target ||
          (asset.type === "pv" && asset.related.includes(target));
    if (!affected) return base;
    const preview: NonNullable<Asset["preview"]> = {
      level: scenario === "fault" ? "critical" : "warning",
      status:
        scenario === "cloud"
          ? "Mây che · xem thử"
          : scenario === "dust"
            ? "Bám bụi · xem thử"
            : asset.type === "inverter"
              ? "Lỗi inverter · xem thử"
              : "Ảnh hưởng lỗi inverter · xem thử",
      reason:
        scenario === "cloud"
          ? "Nằm trong vùng mây che của kịch bản."
          : scenario === "dust"
            ? "Nằm trong vùng bám bụi của kịch bản."
            : "Nằm trong vùng ảnh hưởng của kịch bản lỗi inverter.",
    };
    return { ...base, preview };
  });
}
export function assetStatus(asset: Asset) {
  return {
    level:
      asset.attention?.level === "critical" ||
      asset.preview?.level === "critical"
        ? "critical"
        : asset.attention || asset.preview
          ? "warning"
          : "normal",
    label: asset.preview?.status ?? asset.operation,
    reason: [asset.preview?.reason, asset.attention?.reason]
      .filter(Boolean)
      .join(" "),
  };
}
