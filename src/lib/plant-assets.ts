import type { Asset } from "../data/plant";
import {
  getPlantProfile,
  branchRating,
  type PlantId,
} from "../data/plant-profiles";
import {
  getSiteBlock,
  getSiteBlocks,
  getSiteLayout,
  siteTableShare,
} from "../data/site-layout";

export function isPlantAssetId(
  id: unknown,
  plantId: PlantId = "sava",
): id is string {
  return (
    typeof id === "string" &&
    (getPlantProfile(plantId).assets.some((a) => a.id === id) ||
      (plantId !== "sava" && Boolean(getSiteBlock(plantId, id))))
  );
}
export function resolvePlantAsset(
  assets: Asset[],
  id: string | null,
  plantId: PlantId = "sava",
): Asset | undefined {
  const direct = assets.find((a) => a.id === id);
  if (direct || plantId === "sava") return direct;
  const block = getSiteBlock(plantId, id);
  if (!block) return undefined;
  const parent = assets.find((a) => a.id === block.parentId);
  if (!parent) return undefined;
  const count = 1 / siteTableShare(plantId, block.fieldIndex, block.index);
  const inverter = assets.find((a) => a.id === parent.related[0]);
  const issue = parent.monitoringIssue
    ? structuredClone(parent.monitoringIssue)
    : undefined;
  if (issue?.impact) {
    issue.impact.referenceMW /= count;
    issue.impact.actualMW /= count;
    issue.impact.lossMWh /= count;
    issue.observed = `Phân bổ tác động từ vùng ${parent.id} cho cụm nhỏ này; không phải số đo riêng.`;
  }
  return {
    ...parent,
    id: block.id,
    parentId: parent.id,
    dataScope: `Ước tính phân bổ từ vùng ${parent.id} · Không có số đo riêng từng cụm nhỏ`,
    name: block.name,
    position: [...block.placement.position],
    nominal: `${(branchRating(parent.related[0], plantId).dcMWp / count).toLocaleString("vi-VN", { maximumFractionDigits: 4 })} MWp DC · cụm nhỏ`,
    related: [parent.id, ...parent.related],
    monitoringIssue: issue,
    operatingState:
      inverter?.operatingState === "stopped"
        ? "stopped"
        : parent.operatingState,
    operation:
      inverter?.operatingState === "stopped"
        ? "Dừng phát điện"
        : parent.operation,
    attention: parent.attention
      ? {
          ...parent.attention,
          signalId: parent.attention.signalId.replace(parent.id, block.id),
        }
      : undefined,
    signals: parent.signals.map((signal) => {
      const suffix = signal.id.slice(parent.id.length);
      const factor =
        suffix === ".pdc" ? 1000 / count : suffix === ".idc" ? 1 / count : 1;
      return {
        ...signal,
        id: block.id + suffix,
        assetId: block.id,
        unit: suffix === ".pdc" ? "kW" : signal.unit,
        source: "calculated",
        value: signal.value === null ? null : signal.value * factor,
        history: signal.history.map((v) => (v === null ? null : v * factor)),
        historyTimes: signal.historyTimes
          ? [...signal.historyTimes]
          : undefined,
      };
    }),
  };
}
export function selectableAssetLabels(plantId: PlantId = "sava") {
  const assets = getPlantProfile(plantId).assets;
  return plantId !== "sava"
    ? [
        ...assets,
        ...getSiteBlocks(plantId).map((block) => ({
          id: block.id,
          name: block.name,
          area: block.area,
          type: block.type,
        })),
      ]
    : assets;
}
