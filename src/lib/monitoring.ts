import { assets as registry } from "../data/plant";
import { generate, type Run } from "./simulation";

// Dedicated assumed monitoring history, never used as the scenario baseline.
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
            .map((asset) => [asset.id, factor]),
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
      (previousPower("INV-01") - previousPower("INV-03")) / 60;
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
      lossMWh: snapshot.lossMWh,
    },
  };
  const pv = snapshot.assets.find((asset) => asset.id === "PV-06")!;
  pv.attention = {
    level: "warning",
    reason: "Nhiệt độ 58 °C vượt ngưỡng mẫu 55 °C; chưa giảm sản lượng.",
    signalId: "PV-06.temp",
  };
  pv.monitoringIssue = {
    title: "Nhiệt độ module vượt ngưỡng",
    observed:
      "58 °C > ngưỡng lưu ý 55 °C. Công suất DC vẫn đạt 4,5 MW, bằng mức tham chiếu trong bộ dữ liệu mẫu; chưa ghi nhận tổn thất do nhiệt.",
    consequence:
      "Nếu nhiệt độ tiếp tục tăng hoặc kéo dài, hiệu suất pin có thể giảm và nguy cơ điểm nóng tăng. Cần kiểm tra tản nhiệt và bề mặt pin.",
  };
  const gateway = snapshot.assets.find((asset) => asset.id === "GW-01")!;
  gateway.operation = "Lưu ý";
  gateway.attention = {
    level: "warning",
    reason: "Độ trễ 850 ms vượt ngưỡng mẫu 500 ms; chưa giảm sản lượng.",
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
