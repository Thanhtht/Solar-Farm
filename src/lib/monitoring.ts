import { assets as registry } from "../data/plant";
import { generate, type Run } from "./simulation";

// Assumed history; simulation receives an independent copy as its initial state.
// Samples represent minute intervals [10:00, 10:30), with a final 10:30 reading.
export function createMonitoringSnapshot(): Run {
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
      "monitoring-fixture",
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
          "PV-06.temp": { value: 50 + (8 * minute) / 30 },
          "GW-01.latency": { value: 200 + (650 * minute) / 30 },
          "MET-01.irr": { value: 780 * factor },
          "MET-01.wind": {
            value: 2.4 + 0.2 * Math.sin((minute * Math.PI) / 15),
          },
        },
      },
      run,
    );
    // Left-endpoint integration: the fault starts exactly at 10:15.
    next.energyMWh = (run?.energyMWh ?? 0) + (run ? run.powerMW! / 60 : 0);
    const previousPower = (id: string) =>
      run?.assets
        .find((asset) => asset.id === id)
        ?.signals.find((signal) => signal.id.endsWith(".pac"))?.value ?? 0;
    next.lossMWh =
      (run?.lossMWh ?? 0) +
      (previousPower("INV-01") * 2 -
        previousPower("INV-03") -
        previousPower("INV-06")) /
        60;
    run = next;
  }
  const snapshot = run!;
  const inverter = snapshot.assets.find((asset) => asset.id === "INV-03")!;
  const referenceMW = snapshot.assets
    .find((asset) => asset.id === "INV-01")!
    .signals.find((signal) => signal.id.endsWith(".pac"))!.value!;
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
  const pv = snapshot.assets.find((asset) => asset.id === "PV-06")!;
  pv.operation = "Lưu ý · suy giảm nhẹ";
  pv.operatingState = "degraded";
  pv.attention = {
    level: "warning",
    reason: "Nhiệt độ 58 °C; công suất nhánh giảm nhẹ 2%, tiếp tục theo dõi.",
    signalId: "PV-06.temp",
  };
  pv.monitoringIssue = {
    title: "Nhánh pin 06 suy giảm nhẹ 2%",
    observed:
      "Nhiệt độ module 58 °C. Công suất giảm 2% từ 10:20; đầu ra DC còn 4,41 MW và đầu ra AC còn 4,23 MW. Mức suy giảm thấp, chưa cần báo động.",
    impact: {
      referenceMW,
      actualMW: snapshot.assets.find((asset) => asset.id === "INV-06")!
        .signals[0].value!,
      durationMinutes: 10,
      lossMWh: (referenceMW * 0.02 * 10) / 60,
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
    observed:
      "850 ms > ngưỡng giám sát 500 ms. Vẫn nhận đủ 18 nguồn và heartbeat; các tín hiệu còn hợp lệ, chưa gây giảm sản lượng.",
    consequence:
      "Nếu độ trễ tiếp tục tăng, số đo có thể đến muộn và cảnh báo bị chậm. Khi mẫu quá 120 giây sẽ được đánh dấu dữ liệu cũ; không được tự suy ra thiết bị ngừng phát điện.",
  };
  return snapshot;
}
