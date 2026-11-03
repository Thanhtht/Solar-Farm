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
import { Asset, plant, scenarios, ScenarioId, typeNames } from "@/data/plant";
import { DeviceHud, DeviceDialog, Trend, number } from "./device-profile";
const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
import { createRun, transition, timeLabel } from "@/lib/simulation";
import { scenarioAssets, assetStatus } from "@/lib/scenario-preview";
export default function Dashboard() {
  const [view, setView] = useState<"current" | "simulation">("current");
  const isSimulation = view === "simulation";
  const [current] = useState(() => {
    const initial = createRun();
    return {
      ...initial,
      id: "monitoring-fixture",
      assets: initial.assets.map((a) => ({
        ...a,
        snapshotId: "monitoring-fixture",
        signals: a.signals.map((s) => ({
          ...s,
          snapshotId: "monitoring-fixture",
        })),
      })),
    };
  });
  const [run, setRun] = useState(createRun);
  const snapshot = isSimulation ? run : current;
  const { powerHistory } = snapshot;
  const timestamp = `${timeLabel(snapshot.sampledAt)} ICT`;

  useEffect(() => {
    if (!isSimulation || !run.running) return;
    const timer = window.setInterval(
      () => setRun((r) => transition(r, "tick")),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isSimulation, run.running]);
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
  const [selections, setSelections] = useState<
    Record<"current" | "simulation", string | null>
  >({ current: "INV-01", simulation: "INV-01" });
  const selected = selections[view];
  const setSelected = (id: string | null) =>
    setSelections((previous) => ({ ...previous, [view]: id }));
  const switchView = (next: "current" | "simulation") => {
    if (next === view) return;
    setRun((r) => transition(r, "pause"));
    setDetailsOpen(false);
    setHudVisible(true);
    setView(next);
  };
  const [mode, setMode] = useState<"presets" | "custom">("presets");
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [target, setTarget] = useState("INV-01");
  const [severity, setSeverity] = useState(45);
  const [duration, setDuration] = useState(30);
  const [reset, setReset] = useState(0);
  const [tree, setTree] = useState(false);
  const assets = scenarioAssets(
    snapshot.assets,
    isSimulation ? scenario : null,
    target,
    severity,
  );
  const attentionAssets = assets.filter((a) => a.attention || a.preview);
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
    if (isSimulation && mode === "custom") {
      const clicked = assets.find((a) => a.id === id);
      if (clicked?.type === "inverter") setTarget(id);
      if (clicked?.type === "pv") setTarget(clicked.related[0]);
    }
  };
  const clear = () => {
    setRun((r) => transition(r, "reset"));
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
        <a
          href="#scenarios"
          className="rail-link"
          aria-label="Kịch bản"
          onClick={() => switchView("simulation")}
        >
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
              {isSimulation ? "Chế độ mô phỏng" : "Hiện trạng · dữ liệu mẫu"}
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
            <div
              className="segmented view-tabs"
              role="tablist"
              aria-label="Chế độ nhà máy"
              onKeyDown={(event) => {
                const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                if (!keys.includes(event.key)) return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? "current"
                    : event.key === "End"
                      ? "simulation"
                      : isSimulation
                        ? "current"
                        : "simulation";
                switchView(next);
                document.getElementById(`${next}-tab`)?.focus();
              }}
            >
              <button
                id="current-tab"
                tabIndex={isSimulation ? -1 : 0}
                role="tab"
                aria-selected={!isSimulation}
                aria-controls="plant-view"
                onClick={() => switchView("current")}
              >
                Hiện trạng
              </button>
              <button
                id="simulation-tab"
                tabIndex={isSimulation ? 0 : -1}
                role="tab"
                aria-selected={isSimulation}
                aria-controls="plant-view"
                onClick={() => switchView("simulation")}
              >
                Mô phỏng
              </button>
            </div>
            <div className="plant-meta">
              <span>
                <Sun size={16} />
                {plant.dcMWp} MWp DC
              </span>
            </div>
          </section>
          <section
            className="kpis"
            aria-label={
              isSimulation
                ? "Chỉ số mô phỏng nhà máy"
                : "Chỉ số hiện trạng nhà máy"
            }
          >
            {[
              {
                label: "Công suất AC",
                value:
                  snapshot.powerMW === null ? "—" : number(snapshot.powerMW),
                unit: "MW",
                icon: Zap,
                note: snapshot.missingInverters
                  ? `Thiếu dữ liệu ${snapshot.missingInverters} / 8 inverter`
                  : `Giới hạn AC ${plant.acLimitMW} MW`,
              },
              {
                label: "Năng lượng tích lũy",
                value: number(snapshot.energyMWh),
                unit: "MWh",
                icon: Activity,
                note: isSimulation
                  ? "Theo lượt mô phỏng riêng"
                  : "Snapshot mẫu · chưa tích lũy",
              },
              {
                label: "Khả dụng thiết bị",
                value: number(snapshot.availability),
                unit: "%",
                icon: Cpu,
                note: "Theo trạng thái mô hình · độc lập IoT",
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
            id="plant-view"
            role="tabpanel"
            aria-labelledby={isSimulation ? "simulation-tab" : "current-tab"}
            className={`main-grid ${isSimulation && mode === "custom" ? "custom-mode" : ""}`}
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
                    assets={assets}
                    selected={selected}
                    focusRequest={focusRequest}
                    onSelect={choose}
                    reset={reset}
                    scenario={isSimulation ? scenario : null}
                    target={target}
                    severity={severity}
                  />
                  {isSimulation && (
                    <section
                      id="scenarios"
                      className="scene-scenarios"
                      aria-label="Chọn kịch bản mô phỏng"
                    >
                      <span className="eyebrow">KỊCH BẢN MÔ PHỎNG</span>
                      <div className="scenario-cards">
                        {scenarios.map((s) => (
                          <button
                            key={s.id}
                            className={`scenario-card ${scenario === s.id ? "chosen" : ""}`}
                            aria-pressed={scenario === s.id}
                            onClick={() => selectScenario(s.id)}
                          >
                            <span>{s.icon}</span>
                            {s.name}
                          </button>
                        ))}
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
                          Tự cấu hình
                        </button>
                      </div>
                      <small>
                        Minh họa vùng · chưa tính tác động công suất
                      </small>
                    </section>
                  )}
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
                  {isSimulation && scenario && (
                    <div className="preview-label">
                      Minh họa vùng · {preset?.name}
                      {scenario === "cloud"
                        ? " · 4 cụm pin bên trái"
                        : scenario === "dust"
                          ? ` · ${assets.find((a) => a.type === "pv" && a.related.includes(target))?.id ?? target}`
                          : ""}
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
              {isSimulation && mode === "custom" && (
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
                      value={scenario === "cloud" ? "left-four" : target}
                      disabled={scenario === "cloud"}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      {scenario === "cloud" && (
                        <option value="left-four">
                          4 cụm bên trái · PV-01, 02, 05, 06
                        </option>
                      )}
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
              <section className="panel chart-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">DỮ LIỆU MẪU</span>
                    <h2>
                      {isSimulation
                        ? "Đường công suất cơ sở"
                        : "Công suất hiện trạng"}
                    </h2>
                  </div>
                  <span className="chart-legend">
                    <i className="dot green" />
                    {isSimulation
                      ? "Cơ sở = kịch bản chưa chạy"
                      : "Snapshot mẫu · không phải dữ liệu nhà máy thật"}
                  </span>
                </div>
                {isSimulation && (
                  <div
                    className="scene-top"
                    aria-label="Điều khiển điều kiện nền"
                  >
                    <button
                      className="scene-control"
                      onClick={() =>
                        setRun((r) =>
                          transition(r, r.running ? "pause" : "play"),
                        )
                      }
                    >
                      {run.running ? "Tạm dừng nền" : "Chạy nền"}
                    </button>
                    <button
                      className="scene-control"
                      onClick={() => setRun((r) => transition(r, "reset"))}
                    >
                      Đặt lại nền
                    </button>
                    <span data-testid="run-time">
                      {timestamp} · {run.id} / revision {run.revision}
                    </span>
                  </div>
                )}
                <Trend
                  times={snapshot.times}
                  values={powerHistory}
                  unit="MW"
                  label="Công suất cơ sở"
                />
                <p className="subtle">
                  {isSimulation
                    ? "Lượt mô phỏng độc lập · 1 giây phát lại = 60 giây mô phỏng. Chuyển sang Hiện trạng sẽ tạm dừng lượt; dữ liệu được giữ để tiếp tục."
                    : "Hiện trạng mẫu cố định · không kết nối nhà máy thật. Chạy hoặc đặt lại mô phỏng không thay đổi dữ liệu tại đây."}
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
                      className={assetStatus(a).level}
                      onClick={() => choose(a.id)}
                    >
                      <i className="dot" />
                      <span>
                        <strong>
                          {a.id} · {assetStatus(a).label}
                        </strong>
                        <small>{assetStatus(a).reason}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
                <span className="eyebrow">SỰ KIỆN DỮ LIỆU MẪU</span>
                <p>Đã nhận heartbeat từ gateway.</p>
                <button onClick={() => choose("GW-01")}>
                  <span className="dot green" />
                  GW-01 · {timeLabel(snapshot.sampledAt)}{" "}
                  <ArrowUpRight size={14} />
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
            <span>GIAI ĐOẠN T02A</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
