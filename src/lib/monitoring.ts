import {
  getPlantProfile,
  branchRating,
  pvRating,
  type PlantId,
} from "../data/plant-profiles";
import { baseline } from "./simulation";
import { generate, type Run } from "./simulation";

// Assumed history; simulation receives an independent copy as its initial state.
// Samples represent minute intervals [10:00, 10:30), with a final 10:30 reading.
export function createMonitoringSnapshot(plantId: PlantId = "sava"): Run {
  const registry = getPlantProfile(plantId).assets;
  const warningPV = registry.find(
    (a) => a.type === "pv" && a.related.includes("INV-06"),
  )!.id;
  const referenceFor = (id: string) =>
    Math.min(
      branchRating(id, plantId).acMW,
      ((branchRating(id, plantId).dcMWp * baseline.irradiance) /
        baseline.referenceIrradiance) *
        baseline.dcDerating *
        baseline.efficiency,
    );
  const n = (value: number) =>
    value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  let run: Run | undefined;
  for (let minute = 0; minute <= 30; minute++) {
    const factor = 0.9 + 0.1 * Math.min(minute / 15, 1);
    const signals = Object.fromEntries(
      registry.flatMap((asset) =>
        asset.signals
          .filter((signal) => signal.id.endsWith(".temp"))
          .map((signal) => [
            signal.id,
            {
              value:
                (signal.id === "INV-03.temp" ? 48.6 : signal.value!) -
                (30 - minute) * 0.08,
            },
          ]),
      ),
    );
    const next = generate(
      plantId === "sava"
        ? "monitoring-fixture"
        : `${plantId}-monitoring-fixture`,
      1,
      minute - 30,
      {
        faults: minute >= 15 ? ["INV-03"] : [],
        dcFactors: Object.fromEntries(
          registry
            .filter((asset) => asset.type === "inverter")
            .map((asset) => [
              asset.id,
              factor * (asset.id === "INV-06" && minute >= 20 ? 0.98 : 1),
            ]),
        ),
        signals: {
          ...signals,
          [`${warningPV}.temp`]: { value: 50 + (8 * minute) / 30 },
          "GW-01.latency": { value: 200 + (650 * minute) / 30 },
          "MET-01.irr": { value: 780 * factor },
          "MET-01.wind": {
            value: 2.4 + 0.2 * Math.sin((minute * Math.PI) / 15),
          },
        },
      },
      run,
      plantId,
    );
    // Left-endpoint integration: the fault starts exactly at 10:15.
    next.energyMWh = (run?.energyMWh ?? 0) + (run ? run.powerMW! / 60 : 0);
    const expectedPrevious =
      registry
        .filter((a) => a.type === "inverter")
        .reduce((sum, a) => sum + referenceFor(a.id), 0) *
      (0.9 + 0.1 * Math.min((minute - 1) / 15, 1));
    next.lossMWh =
      (run?.lossMWh ?? 0) +
      (run ? Math.max(0, expectedPrevious - run.modelPowerMW) / 60 : 0);
    run = next;
  }
  const snapshot = run!;
  const inverter = snapshot.assets.find((asset) => asset.id === "INV-03")!;
  const referenceMW = referenceFor("INV-03");
  const actualMW = inverter.signals.find((signal) =>
    signal.id.endsWith(".pac"),
  )!.value!;
  inverter.operation = "Cảnh báo";
  inverter.operatingState = "stopped";
  inverter.attention = {
    level: "critical",
    reason: "Inverter dừng phát điện từ 10:15; đã ảnh hưởng sản lượng.",
    signalId: "INV-03.pac",
  };
  inverter.monitoringIssue = {
    title: "Inverter dừng phát điện",
    observed:
      "Đầu ra AC bằng 0 từ 10:15 đến 10:30. Telemetry và heartbeat vẫn hoạt động; đây là lỗi phát điện, không phải mất kết nối.",
    impact: {
      referenceMW,
      actualMW,
      durationMinutes: 15,
      lossMWh: ((referenceMW - actualMW) * 15) / 60,
    },
  };
  const pv = snapshot.assets.find((asset) => asset.id === warningPV)!;
  pv.operation = "Lưu ý · suy giảm nhẹ";
  pv.operatingState = "degraded";
  pv.attention = {
    level: "warning",
    reason: "Nhiệt độ 58 °C; công suất nhánh giảm nhẹ 2%, tiếp tục theo dõi.",
    signalId: `${warningPV}.temp`,
  };
  const reference06 = referenceFor("INV-06");
  const actual06 = snapshot.assets.find((a) => a.id === "INV-06")!.signals[0]
    .value!;
  pv.monitoringIssue = {
    title: "Nhánh pin 06 suy giảm nhẹ 2%",
    observed: `Nhiệt độ module 58 °C. Công suất giảm 2% từ 10:20; đầu ra DC còn ${n(actual06 / baseline.efficiency)} MW và đầu ra AC còn ${n(actual06)} MW. Mức suy giảm thấp, chưa cần báo động.`,
    impact: {
      referenceMW: reference06,
      actualMW: actual06,
      durationMinutes: 10,
      lossMWh: (reference06 * 0.02 * 10) / 60,
    },
    consequence:
      "Nếu nhiệt độ tiếp tục tăng hoặc kéo dài, hiệu suất pin có thể giảm thêm và nguy cơ điểm nóng tăng. Cần kiểm tra tản nhiệt và bề mặt pin.",
  };
  const relatedInverter = snapshot.assets.find(
    (asset) => asset.id === "INV-06",
  )!;
  relatedInverter.operation = "Lưu ý · suy giảm nhẹ";
  relatedInverter.operatingState = "degraded";
  relatedInverter.monitoringIssue = structuredClone(pv.monitoringIssue);
  const gateway = snapshot.assets.find((asset) => asset.id === "GW-01")!;
  gateway.operation = "Lưu ý";
  gateway.attention = {
    level: "warning",
    reason: "Độ trễ 850 ms vượt ngưỡng 500 ms; chưa giảm sản lượng.",
    signalId: "GW-01.latency",
  };
  gateway.monitoringIssue = {
    title: "Độ trễ truyền dữ liệu cao",
    observed: `850 ms > ngưỡng giám sát 500 ms. Vẫn nhận đủ ${registry.length - 1} nguồn và heartbeat; các tín hiệu còn hợp lệ, chưa gây giảm sản lượng.`,
    consequence:
      "Nếu độ trễ tiếp tục tăng, số đo có thể đến muộn và cảnh báo bị chậm. Khi mẫu quá 120 giây sẽ được đánh dấu dữ liệu cũ; không được tự suy ra thiết bị ngừng phát điện.",
  };
  if (plantId !== "sava")
    for (const asset of snapshot.assets.filter(
      (a) => a.type === "pv" && a.related.includes("INV-03"),
    )) {
      asset.operation = "Dừng phát điện";
      asset.operatingState = "stopped";
      asset.monitoringIssue = structuredClone(inverter.monitoringIssue);
      const share =
        pvRating(asset.id, plantId).dcMWp /
        branchRating("INV-03", plantId).dcMWp;
      if (asset.monitoringIssue?.impact) {
        asset.monitoringIssue.impact.referenceMW *= share;
        asset.monitoringIssue.impact.actualMW *= share;
        asset.monitoringIssue.impact.lossMWh *= share;
      }
    }
  if (plantId === "binh-nguyen") {
    const template = structuredClone(pv);
    for (const asset of snapshot.assets.filter(
      (a) => a.type === "pv" && a.related.includes("INV-06"),
    )) {
      const share =
        pvRating(asset.id, plantId).dcMWp /
        branchRating("INV-06", plantId).dcMWp;
      asset.operation = template.operation;
      asset.operatingState = "degraded";
      asset.attention = {
        ...template.attention!,
        signalId: `${asset.id}.temp`,
        reason: "Nhánh INV-06 suy giảm mô phỏng 2%",
      };
      asset.monitoringIssue = structuredClone(template.monitoringIssue);
      if (asset.monitoringIssue?.impact) {
        asset.monitoringIssue.impact.referenceMW *= share;
        asset.monitoringIssue.impact.actualMW *= share;
        asset.monitoringIssue.impact.lossMWh *= share;
        asset.monitoringIssue.observed = `Phần suy giảm phân bổ cho ${asset.id} từ nhánh INV-06; dữ liệu giả định.`;
      }
    }
  }
  return snapshot;
}
