import type { Asset } from "../data/plant";

export function assetStatus(asset: Asset) {
  return {
    level:
      asset.attention?.level === "critical" ||
      asset.scenario?.level === "critical" ||
      asset.operatingState === "stopped"
        ? "critical"
        : asset.attention ||
            asset.scenario ||
            asset.operatingState === "degraded"
          ? "warning"
          : "normal",
    label: asset.scenario?.label ?? asset.operation,
    reason: [asset.scenario?.reason, asset.attention?.reason]
      .filter(Boolean)
      .join(" "),
  };
}
