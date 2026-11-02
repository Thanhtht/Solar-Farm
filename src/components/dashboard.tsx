"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Box,
  ChevronRight,
  CloudSun,
  Cpu,
  Focus,
  Layers3,
  Leaf,
  Radio,
  RotateCcw,
  Settings2,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import {
  assets,
  Asset,
  plant,
  powerHistory,
  scenarios,
  ScenarioId,
  snapshot,
  timestamp,
  typeNames,
} from "@/data/plant";
const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
const number = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
function Trend({
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
  const [signalId, setSignalId] = useState(asset.signals[0].id);
  const selected =
    asset.signals.find((s) => s.id === signalId) ?? asset.signals[0];
  return (
    <>
      <div className="panel-head">
        <div>
          <span className="eyebrow">HỒ SƠ THIẾT BỊ</span>
          <h2>{asset.name}</h2>
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
      <p className="subtle">
        {typeNames[asset.type]} · {asset.nominal.replace(" · cụm đại diện", "")}
      </p>
      <div className="status-grid">
        <div>
          <small>Vận hành</small>
          <span>
            <i />
            {asset.operation}
          </span>
        </div>
      </div>
      <p className="sample-time">Mốc đo fixture · {timestamp}</p>
      <div className="signal-list">
        {asset.signals.map((s) => (
          <button
            key={s.id}
            onClick={() => setSignalId(s.id)}
            className={`signal ${selected.id === s.id ? "active" : ""}`}
          >
            <span>
              <span
                className={
                  asset.type === "pv" && s.id.endsWith(".temp")
                    ? "sr-only"
                    : undefined
                }
              >
                {asset.type === "pv" && s.id.endsWith(".vdc")
                  ? s.name.replace(" tương đương", "")
                  : s.name}
              </span>
              {!(
                asset.type === "pv" &&
                (s.id.endsWith(".temp") || s.id.endsWith(".vdc"))
              ) && (
                <small>
                  {s.id} ·{" "}
                  {s.source === "calculated" ? "Tính toán" : "Telemetry mẫu"} ·{" "}
                  {s.quality === "valid"
                    ? "Hợp lệ"
                    : s.quality === "stale"
                      ? "Đã cũ"
                      : "Thiếu"}
                </small>
              )}
            </span>
            <strong>
              {s.value === null ? "—" : number(s.value)} <em>{s.unit}</em>
            </strong>
          </button>
        ))}
      </div>
      <div className="mini-chart">
        <span className="eyebrow">XU HƯỚNG MẪU · {selected.unit || "MÃ"}</span>
        <Trend
          values={selected.history}
          unit={selected.unit}
          label={selected.name}
        />
        <p className="subtle">
          6 mẫu cố định, cùng snapshot; chưa có luồng IoT thật.
        </p>
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
          Không có sự cố vận hành trong fixture này. Phân tích AI theo thiết bị
          được bổ sung ở T03.
        </span>
      </div>
    </>
  );
}
export default function Dashboard() {
  const scenePanel = useRef<HTMLElement>(null);
  useEffect(() => {
    const fitScene = () => {
      if (!scenePanel.current) return;
      const top =
        scenePanel.current.getBoundingClientRect().top + window.scrollY;
      scenePanel.current.style.setProperty(
        "--scene-height",
        `${Math.max(240, window.innerHeight - top - 12)}px`,
      );
    };
    const observer = new ResizeObserver(fitScene);
    document
      .querySelectorAll(".topbar, .page-heading, .kpis")
      .forEach((el) => observer.observe(el));
    window.addEventListener("resize", fitScene);
    fitScene();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitScene);
    };
  }, []);
  const [selected, setSelected] = useState<string | null>("INV-01");
  const [mode, setMode] = useState<"presets" | "custom">("presets");
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [target, setTarget] = useState("INV-01");
  const [severity, setSeverity] = useState(45);
  const [duration, setDuration] = useState(30);
  const [reset, setReset] = useState(0);
  const [tree, setTree] = useState(false);
  const asset = assets.find((a) => a.id === selected);
  const preset = scenarios.find((s) => s.id === scenario);
  const selectScenario = (id: ScenarioId) => {
    const item = scenarios.find((s) => s.id === id)!;
    setScenario(id);
    setSeverity(item.severity);
    setDuration(item.duration);
  };
  const choose = (id: string) => {
    setSelected(id);
    if (mode === "custom") {
      const clicked = assets.find((a) => a.id === id);
      if (clicked?.type === "inverter") setTarget(id);
      if (clicked?.type === "pv") setTarget(clicked.related[0]);
    }
  };
  const clear = () => {
    setScenario(null);
    setSeverity(45);
    setDuration(30);
    setTarget("INV-01");
    setSelected("INV-01");
    setReset((v) => v + 1);
  };
  return (
    <div className="app-shell">
      <aside className="rail">
        <a className="brand-mark" href="#overview" aria-label="Solar Farm One">
          <Sun size={27} />
        </a>
        <a href="#overview" className="rail-link active" aria-label="Tổng quan">
          <Layers3 />
        </a>
        <button
          className="rail-link"
          onClick={() => setTree((v) => !v)}
          aria-label="Mở danh sách thiết bị"
        >
          <Box />
        </button>
        <a href="#scenarios" className="rail-link" aria-label="Kịch bản">
          <Settings2 />
        </a>
        <div className="rail-bottom">
          <Leaf size={22} />
          <span>SF</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="header-brand">
            <a href="#overview" aria-label="SAVA — về tổng quan nhà máy">
              <Image
                className="company-logo"
                src="/brand/sava-logo.svg"
                alt="SAVA — GOOD TO GREAT"
                width={806}
                height={625}
                priority
              />
            </a>
            <div className="breadcrumb">
              SOLAR FARM <ChevronRight size={16} />
              <span>Digital Twin</span>
            </div>
          </div>
          <div className="topbar-right">
            <span className="fixture-badge">
              <i />
              Dữ liệu mô phỏng · T01
            </span>
            <span className="avatar">SF</span>
          </div>
        </header>
        <main id="overview">
          <section className="page-heading">
            <div>
              <div className="eyebrow">KHÁM PHÁ NHÀ MÁY CỦA BẠN</div>
              <h1>
                {plant.name}
                <span>Digital Twin</span>
              </h1>
            </div>
            <div className="plant-meta">
              <span>
                <Sun size={16} />
                {plant.dcMWp} MWp DC
              </span>
            </div>
          </section>
          <section className="kpis" aria-label="Chỉ số fixture nhà máy">
            {[
              {
                label: "Công suất AC",
                value: number(snapshot.powerMW),
                unit: "MW",
                icon: Zap,
                note: `Giới hạn AC ${plant.acLimitMW} MW`,
              },
              {
                label: "Năng lượng tích lũy",
                value: number(snapshot.energyMWh),
                unit: "MWh",
                icon: Activity,
                note: "Chưa bắt đầu lượt mô phỏng",
              },
              {
                label: "Khả dụng thiết bị",
                value: number(snapshot.availability),
                unit: "%",
                icon: Cpu,
                note: "8 / 8 inverter bình thường",
              },
              {
                label: "Tổn thất năng lượng",
                value: number(snapshot.lossMWh),
                unit: "MWh",
                icon: Leaf,
                note: "Snapshot cơ sở · chưa có sự kiện",
              },
            ].map((k) => (
              <article className="kpi" key={k.label}>
                <div>
                  <span>{k.label}</span>
                  <k.icon size={17} />
                </div>
                <strong>
                  {k.value}
                  <small>{k.unit}</small>
                </strong>
                <p>{k.note}</p>
              </article>
            ))}
          </section>
          <div
            className={`main-grid ${mode === "custom" ? "custom-mode" : ""}`}
          >
            <div className="left-column">
              <section ref={scenePanel} className="scene-panel">
                <div className="scene-top">
                  <div>
                    <span className="live-dot" />
                    TỔNG QUAN NHÀ MÁY <span className="scene-tag">3D</span>
                  </div>
                  <button
                    onClick={() => setReset((n) => n + 1)}
                    className="scene-control"
                  >
                    <Focus size={15} />
                    Góc nhìn tổng quan
                  </button>
                </div>
                <div className="scene-wrap" data-testid="scene">
                  <PlantScene
                    selected={selected}
                    onSelect={choose}
                    reset={reset}
                    scenario={scenario}
                    target={target}
                    severity={severity}
                  />
                  <div className="scene-coordinate">SF-01 / 50 MWp</div>
                  {scenario && (
                    <div className="preview-label">
                      Minh họa vùng · {preset?.name}
                      <small>Chưa tính tác động công suất</small>
                    </div>
                  )}
                  <div className="compass">
                    <span>N</span>
                    <div>↑</div>
                  </div>
                  <div className="scene-instructions">
                    Kéo để xoay <b>·</b> Cuộn để zoom <b>·</b> Click để khám phá
                  </div>
                </div>
                <div className="scene-footer">
                  <span>
                    <i className="dot green" />
                    Bình thường
                  </span>
                  <span>
                    <i className="dot yellow" />
                    Vùng minh họa
                  </span>
                  <button
                    aria-expanded={tree}
                    onClick={() => setTree((v) => !v)}
                  >
                    <Layers3 size={14} />
                    Danh sách thiết bị <ChevronRight size={14} />
                  </button>
                </div>
              </section>
              {tree && (
                <section className="device-tree panel">
                  <div className="panel-head">
                    <h2>Danh sách thiết bị</h2>
                    <span className="subtle">Chọn thay thế cho cảnh 3D</span>
                  </div>
                  {Object.entries(typeNames).map(([type, name]) => (
                    <div key={type}>
                      <h3>{name}</h3>
                      <div className="device-buttons">
                        {assets
                          .filter((a) => a.type === type)
                          .map((a) => (
                            <button
                              key={a.id}
                              aria-pressed={selected === a.id}
                              onClick={() => choose(a.id)}
                            >
                              {a.id}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
              <section id="scenarios" className="scenario-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">PHÒNG MÔ PHỎNG</span>
                    <h2>Khám phá các tình huống</h2>
                  </div>
                  <div className="segmented">
                    <button
                      aria-pressed={mode === "presets"}
                      onClick={() => setMode("presets")}
                    >
                      Kịch bản có sẵn
                    </button>
                    <button
                      aria-pressed={mode === "custom"}
                      onClick={() => {
                        setMode("custom");
                        if (!scenario) selectScenario("cloud");
                      }}
                    >
                      <Settings2 size={13} />
                      Tự cấu hình
                    </button>
                  </div>
                </div>
                {mode === "presets" ? (
                  <div className="scenario-cards">
                    {scenarios.map((s) => (
                      <button
                        key={s.id}
                        className={`scenario-card ${scenario === s.id ? "chosen" : ""}`}
                        onClick={() => selectScenario(s.id)}
                        aria-pressed={scenario === s.id}
                      >
                        <div>
                          <span className={`scenario-icon ${s.id}`}>
                            {s.icon}
                          </span>
                          <ArrowUpRight size={17} />
                        </div>
                        <small>{s.tag}</small>
                        <h3>{s.name}</h3>
                        <p>{s.description}</p>
                        <span className="card-action">
                          Xem vùng minh họa <ChevronRight size={12} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="panel custom-summary">
                    <Settings2 size={22} />
                    <div>
                      <h3>Tự cấu hình vùng minh họa</h3>
                      <p>
                        Chỉnh loại tình huống và phạm vi ở bảng cạnh cảnh 3D.
                      </p>
                      <small>
                        T01 chỉ đánh dấu vùng; tính toán và phát lại ở T02.
                      </small>
                    </div>
                  </div>
                )}
                <p className="scope-note">
                  Bản dựng giao diện T01: KPI và biểu đồ là fixture cơ sở. Chọn
                  tình huống chỉ thay lớp minh họa 3D.
                </p>
              </section>
              <section className="panel chart-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">DỮ LIỆU MẪU</span>
                    <h2>Đường công suất cơ sở</h2>
                  </div>
                  <span className="chart-legend">
                    <i className="dot green" />
                    Cơ sở = kịch bản chưa chạy
                  </span>
                </div>
                <Trend
                  values={powerHistory}
                  unit="MW"
                  label="Công suất cơ sở"
                />
                <p className="subtle">
                  10:25–10:30 ICT · mẫu quá khứ cố định · không phải kết quả của
                  cấu hình đang chọn.
                </p>
              </section>
            </div>
            <aside className="right-column">
              {mode === "custom" && (
                <section className="panel config-panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">THIẾT LẬP MINH HỌA</span>
                      <h2>Tự cấu hình</h2>
                    </div>
                    <Settings2 size={20} />
                  </div>
                  <label>
                    Loại tình huống
                    <select
                      value={scenario ?? "cloud"}
                      onChange={(e) =>
                        selectScenario(e.target.value as ScenarioId)
                      }
                    >
                      {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cụm chịu ảnh hưởng
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      {assets
                        .filter((a) => a.type === "inverter")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.id} · {a.area}
                          </option>
                        ))}
                    </select>
                  </label>
                  {scenario !== "fault" && (
                    <label>
                      Mức độ minh họa <strong>{severity}%</strong>
                      <input
                        aria-label="Mức độ minh họa"
                        type="range"
                        min="0"
                        max={scenario === "dust" ? 50 : 100}
                        value={severity}
                        onChange={(e) => setSeverity(Number(e.target.value))}
                      />
                      <small>
                        Đầu vào dự kiến, chưa tính suy giảm điện năng.
                      </small>
                    </label>
                  )}
                  <label>
                    Thời lượng dự kiến <strong>{duration} phút</strong>
                    <input
                      aria-label="Thời lượng dự kiến"
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </label>
                  <button className="primary-button" disabled>
                    Chạy mô phỏng · có ở T02
                  </button>
                  <button className="text-button" onClick={clear}>
                    <RotateCcw size={14} />
                    Đặt lại cấu hình
                  </button>
                </section>
              )}
              <section
                className="panel detail-panel"
                aria-label="Chi tiết thiết bị"
                aria-live="polite"
              >
                {asset ? (
                  <DeviceDetails
                    key={asset.id}
                    asset={asset}
                    onSelect={choose}
                    onClose={() => setSelected(null)}
                  />
                ) : (
                  <div className="empty-detail">
                    <Box size={36} />
                    <h2>Khám phá từng thiết bị</h2>
                    <p>
                      Click trong cảnh 3D hoặc mở danh sách để xem hồ sơ và dữ
                      liệu IoT mẫu.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setTree(true)}
                    >
                      Mở danh sách thiết bị
                    </button>
                  </div>
                )}
              </section>
              <section className="panel weather-panel">
                <div className="panel-head">
                  <h2>Điều kiện mẫu</h2>
                  <CloudSun size={23} />
                </div>
                <div className="weather-values">
                  <span>
                    <Sun size={17} />
                    <strong>
                      {number(
                        assets.find((a) => a.id === "MET-01")!.signals[0]
                          .value!,
                      )}
                      <small> W/m²</small>
                    </strong>
                  </span>
                  <span>
                    <Wind size={17} />
                    <strong>
                      {number(
                        assets.find((a) => a.id === "MET-01")!.signals[2]
                          .value!,
                      )}
                      <small> m/s</small>
                    </strong>
                  </span>
                </div>
                <p className="subtle">
                  MET-01 · điểm đo đại diện · {timestamp}
                </p>
              </section>
              <section className="panel notice-panel">
                <span className="eyebrow">SỰ KIỆN DỮ LIỆU MẪU</span>
                <p>Đã nhận heartbeat từ gateway.</p>
                <button onClick={() => choose("GW-01")}>
                  <span className="dot green" />
                  GW-01 · 10:30 <ArrowUpRight size={14} />
                </button>
                <small>Thông báo fixture, không phải cảnh báo sự cố.</small>
              </section>
            </aside>
          </div>
          <footer>
            <span>
              <Sun size={15} />
              SOLAR FARM ONE <b>/</b> DIGITAL TWIN
            </span>
            <p>
              Không kết nối nhà máy thật · Không điều khiển thiết bị · Chưa tích
              hợp AI
            </p>
            <span>GIAI ĐOẠN T01</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
