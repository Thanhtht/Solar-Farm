import { getPlantProfile, type PlantId } from "../data/plant-profiles";
import { assets, scenarios, type ScenarioId } from "../data/plant";
import {
  buildAnalysis,
  contextKey,
  format,
  type AnalysisSelection,
} from "./analysis";
import {
  normalizeConfig,
  presetConfig,
  type Config,
} from "./scenario-simulation";

export const initialSimulationConfig: Config = {
  kind: null,
  target: "INV-01",
  scale: 1,
  severity: 45,
  duration: 60,
  intervention: false,
  interventionMinute: 30,
  recovery: 100,
};
export const simulationHours = [1, 2, 3, 4, 6, 8, 12, 24];
const inverterIds = assets
  .filter((a) => a.type === "inverter")
  .map((a) => a.id);
export type SimulationAction =
  { type: "configure"; config: Config; apply: boolean } | { type: "reset" };
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Lệnh mô phỏng không hợp lệ.");
  return value as Record<string, unknown>;
};
export function readSimulationAction(
  value: unknown,
  source: AnalysisSelection,
): SimulationAction {
  if (source.mode !== "simulation")
    throw new Error(
      "Chỉ thiết lập kịch bản trong tab Mô phỏng; Hiện trạng không bị thay đổi.",
    );
  const plantId = source.plantId ?? source.config.plantId;
  const inverterIds = getPlantProfile(plantId)
    .assets.filter((a) => a.type === "inverter")
    .map((a) => a.id);
  const action = record(value);
  if (action.type === "reset") return { type: "reset" };
  if (action.type !== "configure" || typeof action.apply !== "boolean")
    throw new Error("Lệnh mô phỏng không hợp lệ.");
  const c = record(action.config);
  if (c.plantId !== undefined && c.plantId !== (plantId ?? "sava"))
    throw new Error("Lệnh thuộc nhà máy khác");
  if (
    !scenarios.some((s) => s.id === c.kind) ||
    !inverterIds.includes(String(c.target)) ||
    typeof c.scale !== "number" ||
    !Number.isInteger(c.scale) ||
    c.scale < 1 ||
    c.scale > inverterIds.length ||
    typeof c.duration !== "number" ||
    !simulationHours.includes(c.duration / 60) ||
    typeof c.severity !== "number" ||
    !Number.isFinite(c.severity) ||
    c.severity < 0 ||
    c.severity > (c.kind === "dust" ? 50 : 100) ||
    (c.kind === "fault" && c.severity !== 100) ||
    c.intervention !== false ||
    c.recovery !== 100 ||
    c.interventionMinute !== Math.floor(c.duration / 2)
  )
    throw new Error(
      `Kịch bản cần 1–${inverterIds.length} cụm, thời gian 1/2/3/4/6/8/12/24 giờ và mức giảm trong giới hạn mô hình.`,
    );
  if (c.kind === "cloud" && c.target !== "INV-01")
    throw new Error(
      "Mây che hiện được bố trí theo quy mô các cụm phía trái; chưa hỗ trợ chọn riêng vị trí mây.",
    );
  return {
    type: "configure",
    apply: action.apply,
    config: normalizeConfig({ ...c, plantId } as Config),
  };
}
export function actionFromFunction(
  name: string,
  args: unknown,
  source: AnalysisSelection,
): SimulationAction {
  if (source.mode !== "simulation")
    throw new Error(
      "Anh/chị hãy chuyển sang tab Mô phỏng để thiết lập kịch bản.",
    );
  if (name === "reset_simulation") return { type: "reset" };
  if (name !== "set_simulation")
    throw new Error("Lệnh này không thuộc các thao tác mô phỏng được hỗ trợ.");
  const p = record(args);
  if (!scenarios.some((s) => s.id === p.kind) || typeof p.apply !== "boolean")
    throw new Error("Anh/chị muốn mô phỏng mây che, bám bụi hay lỗi inverter?");
  const kind = p.kind as ScenarioId;
  const base =
    source.config.kind === kind
      ? source.config
      : {
          ...presetConfig(kind, {
            ...initialSimulationConfig,
            plantId: source.plantId ?? source.config.plantId,
          }),
          duration: source.config.duration,
        };
  if (
    p.durationHours !== undefined &&
    (typeof p.durationHours !== "number" ||
      !simulationHours.includes(p.durationHours))
  )
    throw new Error("Thời gian hỗ trợ là 1/2/3/4/6/8/12/24 giờ.");
  const duration =
    p.durationHours === undefined
      ? base.duration
      : Number(p.durationHours) * 60;
  const config = {
    ...base,
    kind,
    scale: p.scale ?? base.scale ?? 1,
    target: p.target ?? (kind === "cloud" ? "INV-01" : base.target),
    severity: p.severityPercent ?? base.severity,
    duration,
    intervention: false,
    interventionMinute: Math.floor(duration / 2),
    recovery: 100,
  };
  return readSimulationAction(
    { type: "configure", config, apply: p.apply },
    source,
  );
}
export function selectionAfterAction(
  action: SimulationAction,
  source: AnalysisSelection,
): AnalysisSelection {
  const safe = readSimulationAction(action, source);
  return {
    ...source,
    revision: source.revision + 1,
    assetId: safe.type === "reset" ? null : source.assetId,
    submitted: safe.type === "configure" && safe.apply,
    config:
      safe.type === "reset"
        ? {
            ...initialSimulationConfig,
            plantId: source.plantId ?? source.config.plantId,
          }
        : safe.config,
  };
}
export function sameSimulationState(
  current: AnalysisSelection,
  source: AnalysisSelection,
) {
  return (
    current.mode === "simulation" &&
    source.mode === "simulation" &&
    contextKey({ ...current, assetId: null }) ===
      contextKey({ ...source, assetId: null })
  );
}
export function describeSimulationAction(
  action: SimulationAction,
  source: AnalysisSelection,
) {
  const next = selectionAfterAction(action, source);
  if (action.type === "reset")
    return {
      context: next,
      answer:
        "Đã đưa tab Mô phỏng về trạng thái ban đầu và bỏ kịch bản vừa áp dụng. Các vấn đề nền như INV-03 dừng phát và nhánh 06 suy giảm vẫn được giữ; Hiện trạng không thay đổi.",
    };
  const c = action.config,
    name = scenarios.find((s) => s.id === c.kind)!.name;
  const details = `${name} · ${c.scale} cụm · ${c.duration / 60} giờ${c.kind !== "fault" ? ` · giảm ${format(c.severity)}%` : ""}${c.kind !== "cloud" ? ` · từ ${c.target}` : ""}`;
  if (!action.apply)
    return {
      context: next,
      answer: `Đã thiết lập kịch bản ${details}, chưa áp dụng. Anh/chị có thể nhắn “xem kết quả” để chạy tình huống này.`,
    };
  const result = buildAnalysis(next);
  return {
    context: next,
    answer: `Đã áp dụng kịch bản ${details} trong tab Mô phỏng.\n\nCông suất giảm thêm ${format(result.future!.lostMW!)} MW; dự kiến mất thêm ${format(result.future!.incrementalLossMWh)} MWh trong ${c.duration / 60} giờ so với trạng thái ban đầu. Anh/chị có thể xem vùng chịu ảnh hưởng trên mô hình 3D; tab Hiện trạng vẫn được giữ nguyên.`,
  };
}
const fold = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
export function referencedAssets(text: string, plantId?: PlantId): string[] {
  const assets = getPlantProfile(plantId).assets;
  const input = fold(text);
  return assets
    .map((a) => {
      const [prefix, num] = a.id.split("-");
      const id = new RegExp(
        `\\b${prefix.toLowerCase()}[-\\s]*0?${Number(num)}\\b`,
      );
      const label = fold(a.name).replace(/ /g, "\\s*");
      const patterns = [id, new RegExp(`\\b${label}\\b`)];
      if (a.type === "inverter")
        patterns.push(new RegExp(`\\binverter\\s*0?${Number(num)}\\b`));
      if (a.type === "pv")
        patterns.push(
          new RegExp(`\\b(?:cum|nhanh)\\s*pin\\s*0?${Number(num)}\\b`),
        );
      const matches = patterns
        .map((p) => input.search(p))
        .filter((i) => i >= 0);
      return { id: a.id, index: matches.length ? Math.min(...matches) : -1 };
    })
    .filter((x) => x.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((x) => x.id);
}
// Force a native call only for explicit commands, leaving explanatory questions conversational.
export function simulationFunctionMode(
  question: string,
  source: AnalysisSelection,
): "AUTO" | "ANY" {
  if (source.mode !== "simulation") return "AUTO";
  const q = fold(question).trim();
  // A concrete what-if is a request to run the supported scenario in this tab.
  const whatIf =
    /^neu\b/.test(q) &&
    /(?:inverter.*(?:hong|loi|dung)|(?:cum|nhanh).*bui|may\s*che)/.test(q);
  const asksAdvice = /(?:kiem tra|khac phuc|sua chua|bao tri|la gi)/.test(q);
  if (whatIf && !asksAdvice) return "ANY";
  if (/^(?:vi sao|tai sao|sao |giai thich|co the|neu |khong )/.test(q))
    return "AUTO";
  const explicit =
    /^(?:(?:anh|chi)\s+)?(?:hay |vui long |giup toi |giup em |chi )?(?:thiet lap|cau hinh|mo phong|chay |ap dung|xem ket qua|ve trang thai ban dau|reset|bo kich ban)/.test(
      q,
    ) || /^cho .*(?:inverter|cum|may|bui).*(?:trong|xem ket qua)/.test(q);
  const hasScenario =
    source.config.kind !== null ||
    /(?:may|bui|inverter|kich ban|trang thai ban dau|reset)/.test(q);
  return explicit && hasScenario ? "ANY" : "AUTO";
}
export const simulationTools = [
  {
    functionDeclarations: [
      {
        name: "set_simulation",
        description:
          "Chỉ cấu hình/xem kịch bản trên tab Mô phỏng, không điều khiển nhà máy thật. Chỉ dùng khi câu hỏi hiện tại yêu cầu thay đổi hoặc chạy mô phỏng; thiếu loại kịch bản và không có cấu hình trước thì hỏi lại. Mây theo các cụm phía trái, target phải INV-01. Mục tiêu INV-xx chỉ cho bụi/lỗi; nếu hỏi cụm PV-xx, dùng inverter liên quan.",
        parameters: {
          type: "OBJECT",
          properties: {
            kind: { type: "STRING", enum: ["cloud", "dust", "fault"] },
            apply: {
              type: "BOOLEAN",
              description:
                "true nếu muốn chạy/xem kết quả ngay; false nếu chỉ thiết lập",
            },
            scale: { type: "INTEGER", minimum: 1, maximum: 8 },
            durationHours: {
              type: "INTEGER",
              description: "Chỉ 1, 2, 3, 4, 6, 8, 12 hoặc 24 giờ",
            },
            severityPercent: {
              type: "NUMBER",
              minimum: 0,
              maximum: 100,
              description:
                "Chỉ khi người dùng yêu cầu; bụi tối đa 50%, lỗi luôn 100%",
            },
            target: { type: "STRING", enum: inverterIds },
          },
          required: ["kind", "apply"],
        },
      },
      {
        name: "reset_simulation",
        description:
          "Đưa tab Mô phỏng về trạng thái ban đầu khi người dùng yêu cầu reset/bỏ kịch bản; không sửa Hiện trạng.",
      },
    ],
  },
];

export function simulationToolsFor(plantId?: PlantId) {
  const inverterIds = getPlantProfile(plantId)
    .assets.filter((a) => a.type === "inverter")
    .map((a) => a.id);
  return [
    {
      functionDeclarations: simulationTools[0].functionDeclarations.map(
        (declaration) =>
          declaration.name !== "set_simulation"
            ? declaration
            : {
                ...declaration,
                parameters: {
                  ...declaration.parameters,
                  properties: {
                    ...declaration.parameters!.properties,
                    scale: {
                      type: "INTEGER",
                      minimum: 1,
                      maximum: inverterIds.length,
                    },
                    target: { type: "STRING", enum: inverterIds },
                  },
                },
              },
      ),
    },
  ];
}
