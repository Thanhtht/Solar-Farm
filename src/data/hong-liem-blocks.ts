import { hongLiemFields } from "./hong-liem-layout";

export const hongLiemBlocks = hongLiemFields.flatMap((field, fieldIndex) =>
  field.rows.map((placement, index) => ({
    id: `PV-${String(fieldIndex + 1).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`,
    parentId: `PV-${String(fieldIndex + 1).padStart(2, "0")}`,
    name: `Cụm pin nhỏ ${String(index + 1).padStart(3, "0")} · ${field.name}`,
    area: field.name,
    type: "pv" as const,
    index,
    fieldIndex,
    placement,
  })),
);
const blockById = new Map(hongLiemBlocks.map((block) => [block.id, block]));
export function getHongLiemBlock(id: string | null | undefined) {
  return id ? blockById.get(id) : undefined;
}
export function blocksInField(parentId: string) {
  return hongLiemBlocks.filter((block) => block.parentId === parentId);
}
