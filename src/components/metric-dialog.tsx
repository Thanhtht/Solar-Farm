"use client";
import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { type Run, timeLabel } from "@/lib/simulation";
import { monitoringMetrics } from "@/lib/monitoring-metrics";
import { assetStatus } from "@/lib/asset-status";
import { Trend, number } from "./device-profile";

export type MetricId = "power" | "energy" | "availability" | "loss";
const titles: Record<MetricId, string> = {
  power: "Công suất AC",
  energy: "Năng lượng tích lũy",
  availability: "Khả dụng thiết bị",
  loss: "Tổn thất năng lượng",
};
const display = (value: number | null) =>
  value === null ? "—" : number(value);

export function MetricDialog({
  metric,
  snapshot,
  onClose,
  onSelectDevice,
}: {
  metric: MetricId;
  snapshot: Run;
  onClose: () => void;
  onSelectDevice: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const data = useMemo(() => monitoringMetrics(snapshot), [snapshot]);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);
  const issues = snapshot.assets.filter(
    (asset) =>
      asset.attention &&
      (metric !== "loss" || (asset.monitoringIssue?.impact?.lossMWh ?? 0) > 0),
  );
  const reference = data.reference.at(-1)!;
  const metrics = {
    power: [
      ["Đang phát", snapshot.powerMW, "MW"],
      ["Công suất dự kiến", reference, "MW"],
      ["Công suất đang mất", data.reduction.at(-1)!, "MW"],
    ],
    energy: [
      ["Đã phát trong 30 phút", snapshot.energyMWh, "MWh"],
      ["Sản lượng dự kiến", data.referenceEnergy.at(-1)!, "MWh"],
      ["Sản lượng đã mất", snapshot.lossMWh, "MWh"],
    ],
    availability: [
      ["Inverter khả dụng", snapshot.availability, "%"],
      [
        "Inverter đang phát",
        data.inverters.filter(
          (asset) =>
            (asset.signals.find((signal) => signal.id.endsWith(".pac"))
              ?.value ?? 0) > 0,
        ).length,
        "/ 8",
      ],
      ["Thiết bị có vấn đề", issues.length, "thiết bị"],
    ],
    loss: [
      ["Sản lượng đã mất", snapshot.lossMWh, "MWh"],
      ["Công suất đang mất", data.reduction.at(-1)!, "MW"],
      [
        "Thời gian sự cố",
        snapshot.assets.find((asset) => asset.monitoringIssue?.impact)
          ?.monitoringIssue?.impact?.durationMinutes ?? 0,
        "phút",
      ],
    ],
  }[metric] as [string, number | null, string][];
  const values = {
    power: snapshot.powerHistory,
    energy: data.energy,
    availability: data.availability,
    loss: data.loss,
  }[metric];
  const weather = snapshot.assets.find((asset) => asset.id === "MET-01")!;
  return (
    <dialog
      ref={ref}
      className="metric-dialog"
      data-metric={metric}
      aria-labelledby="metric-dialog-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="metric-header">
        <div>
          <span className="eyebrow">CHI TIẾT HIỆN TRẠNG</span>
          <h2 id="metric-dialog-title">{titles[metric]}</h2>
          <p>
            Theo dõi · {timeLabel(snapshot.times[0])}–
            {timeLabel(snapshot.sampledAt)} ICT · 1 mẫu/phút
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Đóng chi tiết chỉ số"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="metric-body">
        <div className="metric-totals">
          {metrics.map(([label, value, unit]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>
                {display(value)} <small>{unit}</small>
              </strong>
            </article>
          ))}
        </div>
        <section className="metric-chart" aria-label="Biểu đồ chi tiết chỉ số">
          <h3>{titles[metric]} theo thời gian</h3>
          <Trend
            values={values}
            times={snapshot.times}
            unit={
              metric === "availability"
                ? "%"
                : metric === "power"
                  ? "MW"
                  : "MWh"
            }
            maxValue={metric === "availability" ? 100 : undefined}
            color={metric === "loss" ? "#d74738" : undefined}
            label={titles[metric]}
          />
        </section>
        {metric === "power" && (
          <>
            <p>
              Công suất tại trạm thu gom bằng tổng đầu ra 8 inverter, không cộng
              trạm thêm lần nữa. Giới hạn toàn nhà máy 40 MW AC. INV-03 dừng
              phát và nhánh 06 suy giảm nhẹ làm giảm tổng cộng{" "}
              {display(data.reduction.at(-1)!)} MW.
            </p>
            <div className="metric-table-wrap">
              <table>
                <caption>Đóng góp công suất của từng inverter</caption>
                <thead>
                  <tr>
                    <th>Thiết bị</th>
                    <th>Công suất AC</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inverters.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <button onClick={() => onSelectDevice(asset.id)}>
                          {asset.id} <ArrowUpRight size={12} />
                        </button>
                      </td>
                      <td>
                        {display(
                          asset.signals.find((signal) =>
                            signal.id.endsWith(".pac"),
                          )!.value,
                        )}{" "}
                        MW
                      </td>
                      <td>{assetStatus(asset).label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <section className="metric-context">
              <h3>Điều kiện tại thời điểm đang xem</h3>
              <p>
                {weather.signals
                  .map(
                    (signal) =>
                      `${signal.name.replace(" đại diện", "")}: ${display(signal.value)} ${signal.unit}`,
                  )
                  .join(" · ")}
              </p>
              <button onClick={() => onSelectDevice(weather.id)}>
                Xem trạm thời tiết MET-01 <ArrowUpRight size={13} />
              </button>
            </section>
          </>
        )}
        {metric === "energy" && (
          <>
            <p>
              Năng lượng được cộng từ công suất của từng khoảng một phút (MW ×
              1/60 giờ). Đây là sản lượng trong cửa sổ 10:00–10:30, không phải
              sản lượng cả ngày.
            </p>
            <div className="metric-table-wrap">
              <table>
                <caption>Sản lượng theo khoảng 15 phút</caption>
                <thead>
                  <tr>
                    <th>Thời đoạn</th>
                    <th>Đã phát</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 15].map((start) => (
                    <tr key={start}>
                      <td>
                        {timeLabel(snapshot.times[start])}–
                        {timeLabel(snapshot.times[start + 15])}
                      </td>
                      <td>
                        {display(
                          data.energy[start] === null ||
                            data.energy[start + 15] === null
                            ? null
                            : data.energy[start + 15]! - data.energy[start]!,
                        )}{" "}
                        MWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {metric === "availability" && (
          <p>
            7/8 inverter còn khả dụng phát điện; INV-03 dừng nhưng vẫn gửi
            telemetry. Nhánh 06 giảm nhẹ 2% nhưng vẫn phát điện; GW-01 có độ trễ
            cao. Các vấn đề mức Lưu ý chưa cần báo động và không được tính thành
            inverter ngừng hoạt động.
          </p>
        )}
        {metric === "loss" && (
          <p>
            INV-03 dừng 15 phút: mất 1,08 MWh. Nhánh 06 giảm 2% trong 10 phút:
            mất{" "}
            {display(
              snapshot.assets.find((asset) => asset.id === "PV-06")!
                .monitoringIssue!.impact!.lossMWh,
            )}{" "}
            MWh. Tổng tổn thất {display(snapshot.lossMWh)} MWh. Độ trễ GW-01
            chưa gây giảm sản lượng.
          </p>
        )}
        {(metric === "availability" || metric === "loss") && (
          <div className="metric-issues" aria-label="Thiết bị cần chú ý">
            <h3>
              {metric === "loss"
                ? "Thiết bị gây tổn thất"
                : "1 Cảnh báo · 2 Lưu ý"}
            </h3>
            {issues.map((asset) => (
              <button
                key={asset.id}
                className={assetStatus(asset).level}
                onClick={() => onSelectDevice(asset.id)}
              >
                <span>
                  <strong>
                    {asset.id} · {assetStatus(asset).label}
                  </strong>
                  <small>{asset.attention!.reason}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        )}
        <p className="metric-source">
          Cập nhật mỗi phút · Thời đoạn 10:00–10:30 ICT.
        </p>
      </div>
    </dialog>
  );
}
