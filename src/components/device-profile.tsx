"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Cpu, Radio, X } from "lucide-react";
import { Asset, Signal, timestamp, typeNames } from "@/data/plant";
export const number = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export function Trend({
  values,
  unit,
  label,
}: {
  values: number[];
  unit: string;
  label: string;
}) {
  const gradientId = useId();
  if (!values.length) return <p>Chưa có lịch sử mẫu.</p>;
  const max = Math.max(...values, 1) * 1.15,
    min = Math.min(0, ...values);
  const points = values
    .map(
      (v, i) =>
        `${40 + (i * 450) / (values.length - 1)},${115 - ((v - min) / (max - min)) * 90}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 510 155"
      role="img"
      aria-label={`${label}; ${unit}; lịch sử mẫu 10:25 đến 10:30`}
      className="trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#009d82" stopOpacity=".25" />
          <stop offset="1" stopColor="#009d82" stopOpacity="0" />
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
        points={`40,115 ${points} 490,115`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke="#009d82"
        strokeWidth="2.5"
      />
      <text x="40" y="143">
        10:25
      </text>
      <text x="240" y="143">
        10:27
      </text>
      <text x="458" y="143">
        10:30
      </text>
    </svg>
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
  const [signalId, setSignalId] = useState(
    asset.attention?.signalId ?? asset.signals[0].id,
  );
  const selected =
    asset.signals.find((s) => s.id === signalId) ?? asset.signals[0];
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
            ×
          </button>
        </div>
        <div className="device-id">
          <Cpu size={15} />
          {asset.id}
          <span>{asset.area}</span>
        </div>
        {asset.type !== "weather" && (
          <p className="subtle">
            {typeNames[asset.type]} ·{" "}
            {asset.nominal
              .replace(" · cụm đại diện", "")
              .replace(" · heartbeat mẫu", "")}
          </p>
        )}
        <div className={`status-grid ${asset.attention?.level ?? "normal"}`}>
          <div>
            <small>Vận hành</small>
            <span>
              <i />
              {asset.operation}
            </span>
          </div>
        </div>
        <p className="sample-time">Cập nhật · {timestamp}</p>
      </div>
      <div className="device-content">
        <div className="signal-list">
          {asset.signals.map((s) => (
            <button
              key={s.id}
              onClick={() => setSignalId(s.id)}
              className={`signal ${selected.id === s.id ? "active" : ""} ${s.id === asset.attention?.signalId ? `attention-${asset.attention.level}` : ""}`}
            >
              <span>
                <span>{signalLabel(asset, s)}</span>
              </span>
              <strong>
                {s.value === null ? "—" : number(s.value)} <em>{s.unit}</em>
              </strong>
            </button>
          ))}
        </div>
        <div className="mini-chart">
          <span className="eyebrow">
            XU HƯỚNG MẪU · {selected.unit || "MÃ"}
          </span>
          <Trend
            values={selected.history}
            unit={selected.unit}
            label={selected.name}
          />
        </div>
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
            {asset.attention?.reason ?? "Không có cảnh báo vận hành."}
          </span>
        </div>
      </div>
    </>
  );
}

export function signalLabel(asset: Asset, s: Signal) {
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
      className={`scene-hud ${asset.attention?.level ?? "normal"}`}
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
        {asset.operation}
      </div>
      {asset.attention && (
        <p className="hud-reason">{asset.attention.reason}</p>
      )}
      <dl>
        {signals.map((s) => (
          <div
            key={s.id}
            className={
              s.id === asset.attention?.signalId
                ? `hud-attention ${asset.attention.level}`
                : undefined
            }
          >
            <dt>{signalLabel(asset, s)}</dt>
            <dd>
              {s.value === null ? "—" : number(s.value)} <small>{s.unit}</small>
            </dd>
          </div>
        ))}
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
