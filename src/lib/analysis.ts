import { assets as registry, type Asset } from "../data/plant";
import { createMonitoringSnapshot } from "./monitoring";
import {
  createSession,
  forecast,
  normalizeConfig,
  powerAt,
  referencePower,
  type Config,
} from "./scenario-simulation";
import type { Run } from "./simulation";

export type AnalysisSelection = {
  mode: "current" | "simulation";
  assetId: string;
  revision: number;
  submitted: boolean;
  config: Config;
};
export type Finding = {
  id: string;
  assetIds: string[];
  title: string;
  evidence: string;
  impact: string;
  check: string;
  limit: string;
};
export const format = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
function configKey(config: Config) {
  const c = normalizeConfig(config);
  return [
    c.kind,
    c.target,
    c.scale,
    c.severity,
    c.duration,
    c.intervention,
    c.interventionMinute,
    c.recovery,
  ];
}
export function contextKey(s: AnalysisSelection) {
  return JSON.stringify([
    s.mode,
    s.assetId,
    s.revision,
    s.submitted,
    s.mode === "simulation" ? configKey(s.config) : null,
  ]);
}
export function eventKey(s: AnalysisSelection) {
  return JSON.stringify([
    s.mode,
    s.revision,
    s.submitted,
    s.submitted ? configKey(s.config) : null,
  ]);
}
const actions = (asset: Asset) =>
  asset.type === "gateway"
    ? "Kiểm tra đường truyền, hàng đợi gateway và thời điểm nhận mẫu."
    : asset.id === "PV-06" || asset.id === "INV-06"
      ? "Kiểm tra bề mặt pin, tản nhiệt và đối chiếu số đo của nhánh 06."
      : "Đối chiếu mã lỗi, đầu ra và bảo vệ theo quy trình an toàn của đội vận hành.";
export function findings(run: Run, initial: Run): Finding[] {
  return initial.assets
    .filter((a) => a.attention && a.monitoringIssue)
    .map((a) => {
      const issue = a.monitoringIssue!;
      const related = a.id === "PV-06" ? ["PV-06", "INV-06"] : [a.id];
      const usable = related.every((id) =>
        run.assets
          .find((x) => x.id === id)
          ?.signals.every((s) => s.quality === "valid" && s.value !== null),
      );
      const impact = issue.impact;
      return {
        id: a.id,
        assetIds: related,
        title: issue.title,
        evidence: usable
          ? issue.observed
          : "Dữ liệu thiếu, cũ hoặc không hợp lệ; chưa đủ bằng chứng xác nhận trạng thái hiện tại.",
        impact:
          usable && impact
            ? `Đã mất ${format(impact.lossMWh)} MWh trong ${impact.durationMinutes} phút trước 10:30; giảm ${format(impact.referenceMW - impact.actualMW)} MW AC tại nền.`
            : usable
              ? "Chưa ghi nhận tổn thất năng lượng do vấn đề này."
              : "Không thay số đo thiếu bằng 0; không suy ra thiết bị hỏng từ kết nối.",
        check: actions(a),
        limit:
          "Vấn đề nền trước kịch bản; cần xác minh nguyên nhân bằng kiểm tra thực tế.",
      };
    });
}
export function buildAnalysis(s: AnalysisSelection, source?: Run) {
  const initial = source ?? createMonitoringSnapshot();
  const applied =
    s.mode === "simulation" && s.submitted && s.config.kind !== null;
  const run = applied
    ? createSession(s.config, s.revision, initial).untreated
    : initial;
  const asset = run.assets.find((a) => a.id === s.assetId)!;
  const estimate = applied ? forecast(s.config, initial) : null;
  const lostMW = applied
    ? Math.max(
        0,
        referencePower(initial) - powerAt(s.config, 0, false, initial),
      )
    : null;
  const issues = findings(run, initial);
  if (applied) {
    // Use inverter IDs only: PV and transformer are not additional losses.
    const impacted = run.assets.filter(
      (a) => a.type === "inverter" && a.scenario,
    );
    issues.unshift({
      id: "scenario",
      assetIds: impacted.map((a) => a.id),
      title: "Kết quả kịch bản đã áp dụng",
      evidence: `${impacted.map((a) => a.id).join(", ")} · ${s.config.duration / 60} giờ; nền ${format(referencePower(initial))} MW.`,
      impact: `Giảm thêm ${format(lostMW!)} MW; dự kiến mất thêm ${format(estimate!.lossMWh)} MWh trong ${s.config.duration / 60} giờ sau 10:30.`,
      check:
        s.config.kind === "cloud"
          ? "Đối chiếu phạm vi mây và bức xạ; theo dõi công suất khi mây đi qua."
          : s.config.kind === "dust"
            ? "Kiểm tra mức bám bẩn trước khi cân nhắc vệ sinh theo quy trình."
            : "Ưu tiên kiểm tra inverter mất đầu ra theo quy trình an toàn.",
      limit:
        "Ước tính toàn thời đoạn với điều kiện hằng; không phải năng lượng đã đo, không cộng tổn thất quá khứ.",
    });
  }
  const compactAsset = (a: Asset) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    operation: a.operation,
    connection: a.connection,
    related: a.related,
    scenario: a.scenario ?? null,
    signals: a.signals.map((t) => ({
      id: t.id,
      name: t.name,
      unit: t.unit,
      quality: t.quality,
      value: t.quality === "valid" ? t.value : null,
      sampledAt: t.sampledAt,
      recent: t.history.slice(-3),
    })),
  });
  return {
    key: contextKey(s),
    event: eventKey(s),
    mode: s.mode,
    assetId: s.assetId,
    revision: s.revision,
    submitted: applied,
    runId: run.id,
    sampledAt: run.sampledAt,
    config: applied ? normalizeConfig(s.config) : null,
    historical: {
      from: initial.times[0],
      to: initial.sampledAt,
      energyMWh: initial.energyMWh,
      lossMWh: initial.lossMWh,
    },
    current: { powerMW: run.powerMW, availability: run.availability },
    future: applied
      ? {
          durationMinutes: s.config.duration,
          referenceMW: referencePower(initial),
          lostMW,
          incrementalLossMWh: estimate!.lossMWh,
        }
      : null,
    selected: compactAsset(asset),
    related: run.assets
      .filter((a) => asset.related.includes(a.id))
      .slice(0, 8)
      .map(compactAsset),
    findings: issues,
    limits:
      "Chỉ tư vấn; không điều khiển thiết bị. Không chẩn đoán chắc chắn, cam kết tiết kiệm hoặc tạo số mới. Dữ liệu không đủ phải nêu rõ.",
  };
}

// Public requests contain only identifiers and scenario inputs. The server
// reconstructs every fact; browser-provided MW/MWh or issue prose is never trusted.
export function parseSelection(value: unknown): AnalysisSelection {
  if (!value || typeof value !== "object")
    throw new Error("Ngữ cảnh không hợp lệ");
  const v = value as Record<string, unknown>;
  if (
    (v.mode !== "current" && v.mode !== "simulation") ||
    !registry.some((a) => a.id === v.assetId) ||
    typeof v.submitted !== "boolean" ||
    !Number.isSafeInteger(v.revision) ||
    Number(v.revision) < 1 ||
    Number(v.revision) > 1000000
  )
    throw new Error("Ngữ cảnh không hợp lệ");
  if (!v.config || typeof v.config !== "object")
    throw new Error("Thiếu cấu hình mô phỏng");
  const c = v.config as Record<string, unknown>;
  if (
    !["severity", "duration", "interventionMinute", "recovery", "scale"].every(
      (k) => typeof c[k] === "number" && Number.isFinite(c[k]),
    ) ||
    typeof c.intervention !== "boolean" ||
    typeof c.target !== "string"
  )
    throw new Error("Tham số không hợp lệ");
  const config = normalizeConfig({
    kind: c.kind as Config["kind"],
    target: c.target,
    scale: c.scale as number,
    severity: c.severity as number,
    duration: c.duration as number,
    intervention: c.intervention,
    interventionMinute: c.interventionMinute as number,
    recovery: c.recovery as number,
  });
  return {
    mode: v.mode as AnalysisSelection["mode"],
    assetId: v.assetId as string,
    revision: v.revision as number,
    submitted: v.submitted,
    config,
  };
}
