"use client";
import { useEffect, useId, useRef } from "react";
import { ArrowUpRight, Cpu, Radio, X } from "lucide-react";
import { Asset, Signal, typeNames } from "@/data/plant";
import { timeLabel, baseline } from "@/lib/simulation";
import { assetStatus } from "@/lib/asset-status";
export const number = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export function Trend({
  values,
  times,
  maxValue,
  unit,
  label,
  color = "#009d82",
}: {
  values: (number | null)[];
  times?: string[];
  maxValue?: number;
  unit: string;
  label: string;
  color?: string;
}) {
  const gradientId = useId();
  if (!values.length) return <p>Chưa có lịch sử mẫu.</p>;
  const present = values.filter((v): v is number => v !== null);
  const max = maxValue ?? Math.max(...present, 1) * 1.15,
    min = Math.min(0, ...present);
  const labels =
    times ??
    values.map((_, i) =>
      new Date(Date.parse(baseline.start) + i * 60000).toISOString(),
    );
  const points = values
    .map((v, i) =>
      v === null
        ? ""
        : `${40 + (i * 450) / Math.max(1, values.length - 1)},${115 - ((v - min) / (max - min)) * 90}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 510 155"
      role="img"
      aria-label={`${label}; ${unit}; lịch sử ${timeLabel(labels[0])} đến ${timeLabel(labels.at(-1)!)}`}
      className="trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity=".25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 70, 115].map((y) => (
        <line
          key={y}
          x1="40"
          y1={y}
          x2="490"
          y2={y}
          stroke="#dce8ec"
          strokeDasharray="3 5"
        />
      ))}
      <text x="3" y="17">
        {unit}
      </text>
      <text x="3" y="35">
        {number(max)}
      </text>
      <text x="14" y="119">
        0
      </text>
      <polygon
        display={
          values.length < 2 || values.some((v) => v === null)
            ? "none"
            : undefined
        }
        points={`40,115 ${points} 490,115`}
        fill={`url(#${gradientId})`}
      />
      {values.map((v, i) =>
        v !== null ? (
          <circle
            key={i}
            cx={40 + (i * 450) / Math.max(1, values.length - 1)}
            cy={115 - ((v - min) / (max - min)) * 90}
            r="2"
            fill={color}
          />
        ) : null,
      )}
      {values.every((v) => v !== null) && (
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
      )}
      <text x="40" y="143">
        {timeLabel(labels[0])}
      </text>
      <text x="240" y="143">
        {timeLabel(labels[Math.floor((labels.length - 1) / 2)])}
      </text>
      <text x="458" y="143">
        {timeLabel(labels.at(-1)!)}
      </text>
    </svg>
  );
}
function ScenarioNote({ asset }: { asset: Asset }) {
  return asset.scenario ? (
    <p className="scenario-status-note">Dữ liệu mô phỏng theo kịch bản</p>
  ) : null;
}
function MonitoringIssue({ asset }: { asset: Asset }) {
  const issue = asset.monitoringIssue;
  if (!issue) return null;
  return (
    <section
      className={`monitoring-issue ${assetStatus(asset).level}`}
      aria-label="Giải thích vấn đề thiết bị"
    >
      <strong>{issue.title}</strong>
      {asset.scenario && (
        <p>
          <b>Vấn đề có sẵn ở trạng thái ban đầu, trước kịch bản:</b>
        </p>
      )}
      <p>{issue.observed}</p>
      {issue.impact && (
        <p className="monitoring-impact">
          Công suất giảm/mất:{" "}
          <b>{number(issue.impact.referenceMW - issue.impact.actualMW)} MW</b> (
          {number(issue.impact.referenceMW)} → {number(issue.impact.actualMW)}{" "}
          MW). Sản lượng mất: <b>{number(issue.impact.lossMWh)} MWh</b> trong{" "}
          {issue.impact.durationMinutes} phút.
        </p>
      )}
      {issue.consequence && (
        <p>
          <b>Nguy cơ nếu tiếp diễn:</b> {issue.consequence}
        </p>
      )}
    </section>
  );
}
function DeviceDetails({
  asset,
  onSelect,
  onClose,
}: {
  asset: Asset;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="device-summary">
        <div className="panel-head">
          <div>
            <span className="eyebrow">HỒ SƠ THIẾT BỊ</span>
            <h2 id="device-details-title">{asset.name}</h2>
          </div>
          <button
            aria-label="Đóng hồ sơ thiết bị"
            className="icon-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <div className="details-identity">
          <span>
            <Cpu size={14} /> <strong>{asset.id}</strong> · {asset.area}
          </span>
          {asset.type !== "weather" && (
            <span>
              {typeNames[asset.type]} ·{" "}
              {asset.nominal
                .replace(" · cụm đại diện", "")
                .replace(" · heartbeat mẫu", "")}
            </span>
          )}
        </div>
        <div className="details-meta">
          <span className={`details-status ${assetStatus(asset).level}`}>
            <i />
            {assetStatus(asset).label}
          </span>
          <span
            title={`${asset.snapshotId} / revision ${asset.revision} · ${asset.connection}`}
          >
            Cập nhật · {timeLabel(asset.sampledAt ?? baseline.start)} ICT
          </span>
        </div>
      </div>
      <ScenarioNote asset={asset} />
      <div className="device-content">
        <MonitoringIssue asset={asset} />
        {asset.snapshotId === "monitoring-fixture" && (
          <p className="monitoring-history-note">
            Lịch sử · 10:00–10:30 ICT · 1 mẫu/phút.
          </p>
        )}
        <div className="device-trends" aria-label="Xu hướng các thông số">
          {asset.signals.map((signal) => {
            const level =
              signal.id === asset.attention?.signalId
                ? asset.attention.level
                : "normal";
            return (
              <article key={signal.id} className={`device-trend-card ${level}`}>
                <header>
                  <h3>{signalLabel(asset, signal)}</h3>
                  {level !== "normal" && <span>{asset.operation}</span>}
                </header>
                <strong className="trend-current">
                  {signal.value === null || signal.quality === "invalid"
                    ? "—"
                    : number(signal.value)}{" "}
                  <em>{signal.unit}</em>
                </strong>
                <small>
                  {signal.quality === "valid"
                    ? "Hợp lệ"
                    : signal.quality === "stale"
                      ? "Đã cũ"
                      : signal.quality === "invalid"
                        ? "Không hợp lệ"
                        : "Thiếu"}{" "}
                  · {timeLabel(signal.sampledAt)} ICT
                </small>
                <Trend
                  values={signal.history}
                  times={signal.historyTimes}
                  unit={signal.unit}
                  label={signalLabel(asset, signal)}
                  color={
                    level === "critical"
                      ? "#d74738"
                      : level === "warning"
                        ? "#b88008"
                        : undefined
                  }
                />
              </article>
            );
          })}
        </div>
        <div className="details-footer">
          <div className="relations">
            <span className="eyebrow">THIẾT BỊ LIÊN QUAN</span>
            <div>
              {asset.related.map((id) => (
                <button key={id} onClick={() => onSelect(id)}>
                  {id}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className="note">
            <Radio size={16} />
            <span>
              {assetStatus(asset).reason || "Không có cảnh báo vận hành."}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export function signalLabel(asset: Asset, s: Signal) {
  if (asset.type === "inverter" && s.id.endsWith(".fault"))
    return "Mã lỗi (0: bình thường, 1: đang lỗi)";
  return asset.type === "pv"
    ? ({
        temp: "Nhiệt độ",
        vdc: "Điện áp mạch DC",
        idc: "Dòng DC",
        pdc: "Công suất DC",
      }[s.id.split(".").pop()!] ?? s.name)
    : s.name.replace(" đại diện", "").replace(" mẫu", "");
}
export function DeviceHud({
  asset,
  onHide,
  onDetails,
}: {
  asset: Asset;
  onHide: () => void;
  onDetails: () => void;
}) {
  const signals = [...asset.signals].sort(
    (a, b) =>
      Number(b.id === asset.attention?.signalId) -
      Number(a.id === asset.attention?.signalId),
  );
  return (
    <section
      className={`scene-hud ${assetStatus(asset).level}`}
      aria-label="Hồ sơ nhanh thiết bị"
      aria-live="polite"
    >
      <header>
        <div>
          <span className="eyebrow">THIẾT BỊ ĐANG CHỌN</span>
          <h2>{asset.name}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Ẩn hồ sơ thiết bị"
          onClick={onHide}
        >
          <X size={17} />
        </button>
      </header>
      <div className="hud-identity">
        <strong>{asset.id}</strong>
        <span>{asset.area}</span>
      </div>
      <div className="hud-status">
        <i />
        {assetStatus(asset).label}
      </div>
      <ScenarioNote asset={asset} />
      <MonitoringIssue asset={asset} />
      {!asset.monitoringIssue && (asset.attention || asset.scenario) && (
        <p className="hud-reason">{assetStatus(asset).reason}</p>
      )}
      <dl>
        {signals.map((s) => {
          const fault = asset.type === "inverter" && s.id.endsWith(".fault");
          const unavailable =
            s.value === null ||
            s.quality === "invalid" ||
            s.quality === "missing";
          const state = unavailable
            ? "Chưa xác định"
            : s.value === 0
              ? asset.operation
              : "Đang lỗi";
          return (
            <div
              key={s.id}
              className={
                s.id === asset.attention?.signalId
                  ? `hud-attention ${asset.attention.level}`
                  : undefined
              }
            >
              <dt>{fault ? "Trạng thái inverter" : signalLabel(asset, s)}</dt>
              <dd>
                {fault
                  ? `${state}${s.quality === "stale" ? " · dữ liệu cũ" : ""}`
                  : unavailable
                    ? "—"
                    : number(s.value!)}{" "}
                <small>{s.unit}</small>
              </dd>
            </div>
          );
        })}
      </dl>
      <button className="hud-details" onClick={onDetails}>
        Xem chi tiết <ArrowUpRight size={15} />
      </button>
    </section>
  );
}
export function DeviceDialog({
  asset,
  onSelect,
  onClose,
  frame,
}: {
  asset: Asset;
  onSelect: (id: string) => void;
  onClose: () => void;
  frame: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const position = () => {
      const box = frame.current?.getBoundingClientRect();
      if (!box) return;
      const top = Math.max(8, box.top + 12);
      const left = Math.max(8, box.left + 12);
      const height = Math.max(
        180,
        Math.min(window.innerHeight - 8, box.bottom - 12) - top,
      );
      dialog.style.top = `${top}px`;
      dialog.style.left = `${left}px`;
      dialog.style.width = `${Math.min(box.width - 24, window.innerWidth - left - 8)}px`;
      dialog.style.height = `${height}px`;
    };
    position();
    dialog.showModal();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      if (dialog.open) dialog.close();
      frame.current?.querySelector<HTMLButtonElement>(".hud-details")?.focus();
    };
  }, [frame]);
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLButtonElement>(
        'button[aria-label="Đóng hồ sơ thiết bị"]',
      )
      ?.focus();
  }, [asset.id]);
  return (
    <dialog
      ref={ref}
      className="device-dialog"
      aria-labelledby="device-details-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <DeviceDetails
        key={asset.id}
        asset={asset}
        onSelect={onSelect}
        onClose={onClose}
      />
    </dialog>
  );
}
