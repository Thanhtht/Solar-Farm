"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  MessageCircle,
  Send,
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
  attentionAssets,
} from "@/data/plant";
import { DeviceHud, DeviceDialog, Trend, number } from "./device-profile";
const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
export default function Dashboard() {
  const scenePanel = useRef<HTMLElement>(null);
  const sceneFrame = useRef<HTMLDivElement>(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    const fitScene = () => {
      if (!scenePanel.current) return;
      const top =
        scenePanel.current.getBoundingClientRect().top + window.scrollY;
      scenePanel.current
        .closest<HTMLElement>(".main-grid")
        ?.style.setProperty(
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
    setHudVisible(true);
    setFocusRequest((n) => n + 1);
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
    setHudVisible(true);
    setDetailsOpen(false);
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
                src="/brand/sava-logo.png"
                alt="SAVA — GOOD TO GREAT"
                width={808}
                height={632}
                priority
                unoptimized
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
                note: "8 / 8 inverter đang vận hành",
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
                <div
                  ref={sceneFrame}
                  className="scene-wrap"
                  data-testid="scene"
                >
                  <PlantScene
                    selected={selected}
                    focusRequest={focusRequest}
                    onSelect={choose}
                    reset={reset}
                    scenario={scenario}
                    target={target}
                    severity={severity}
                  />
                  {asset && hudVisible && (
                    <DeviceHud
                      asset={asset}
                      onHide={() => setHudVisible(false)}
                      onDetails={() => setDetailsOpen(true)}
                    />
                  )}
                  {asset && detailsOpen && (
                    <DeviceDialog
                      asset={asset}
                      onSelect={choose}
                      onClose={() => setDetailsOpen(false)}
                      frame={sceneFrame}
                    />
                  )}
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
                    <span className="mouse-hint">
                      Chuột trái: xoay <b>·</b> Chuột phải: dịch chuyển <b>·</b>{" "}
                      Cuộn: zoom
                    </span>
                    <span className="touch-hint">
                      1 ngón: xoay <b>·</b> 2 ngón: dịch chuyển / zoom
                    </span>
                  </div>
                </div>
                <div className="scene-footer">
                  <span>
                    <i className="dot green" />
                    Bình thường
                  </span>
                  <span>
                    <i className="dot yellow" />
                    Lưu ý
                  </span>
                  <span>
                    <i className="dot red" />
                    Cảnh báo
                  </span>
                  {asset && !hudVisible && (
                    <button
                      className="hud-restore"
                      onClick={() => setHudVisible(true)}
                    >
                      Hiện hồ sơ
                    </button>
                  )}
                  <button
                    aria-expanded={tree}
                    onClick={() => setTree((v) => !v)}
                  >
                    <Layers3 size={14} />
                    Danh sách thiết bị <ChevronRight size={14} />
                  </button>
                </div>
              </section>
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
              <section className="panel ai-panel" aria-label="Trợ lý AI">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">ĐỒNG HÀNH VẬN HÀNH</span>
                    <h2>Trợ lý AI</h2>
                  </div>
                  <MessageCircle size={22} />
                </div>
                <span className="ai-offline">Chưa kết nối</span>
                {asset && (
                  <div className="ai-context">
                    Thiết bị đang xem{" "}
                    <strong>
                      {asset.id} · {asset.name}
                    </strong>
                  </div>
                )}
                <div className="ai-empty">
                  <MessageCircle size={34} />
                  <h3>Trao đổi về nhà máy</h3>
                  <p>Hỏi về thiết bị, số liệu và phương án vận hành.</p>
                  <small>Trợ lý AI chưa được kết nối.</small>
                </div>
                <div className="ai-composer">
                  <textarea
                    aria-label="Nhập câu hỏi cho AI"
                    placeholder="Kết nối AI để bắt đầu trao đổi"
                    disabled
                  />
                  <button className="primary-button" disabled>
                    <Send size={15} />
                    Gửi câu hỏi
                  </button>
                </div>
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
                <div className="attention-list" aria-label="Thiết bị cần chú ý">
                  <span className="eyebrow">THIẾT BỊ CẦN CHÚ Ý</span>
                  {attentionAssets.map((a) => (
                    <button
                      key={a.id}
                      className={a.attention!.level}
                      onClick={() => choose(a.id)}
                    >
                      <i className="dot" />
                      <span>
                        <strong>
                          {a.id} · {a.operation}
                        </strong>
                        <small>{a.attention!.reason}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
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
