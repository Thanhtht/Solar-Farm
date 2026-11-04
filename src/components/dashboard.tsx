"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronRight,
  Cpu,
  Focus,
  Layers3,
  Leaf,
  Sun,
  Zap,
} from "lucide-react";
import { plant, scenarios, ScenarioId, typeNames } from "@/data/plant";
import { DeviceHud, DeviceDialog, number } from "./device-profile";
const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
import { createMonitoringSnapshot } from "@/lib/monitoring";
import {
  createSession,
  sessionAction,
  presetConfig,
  normalizeConfig,
  effects,
  type Config,
} from "@/lib/scenario-simulation";
import { SimulationSetup } from "./simulation-setup";
import { MetricDialog, type MetricId } from "./metric-dialog";
import { AiPanel } from "./ai-panel";
import {
  initialSimulationConfig as initialConfig,
  readSimulationAction,
  sameSimulationState,
  selectionAfterAction,
  type SimulationAction,
} from "@/lib/assistant-actions";
import { type AnalysisSelection } from "@/lib/analysis";
import { monitoringMetrics } from "@/lib/monitoring-metrics";
export default function Dashboard() {
  const [view, setView] = useState<"current" | "simulation">("current");
  const isSimulation = view === "simulation";
  const [current] = useState(createMonitoringSnapshot);
  const [simulationInitial] = useState(createMonitoringSnapshot);
  const [metric, setMetric] = useState<MetricId | null>(null);
  const [session, setSession] = useState(() =>
    createSession(initialConfig, 1, simulationInitial),
  );
  const [submitted, setSubmitted] = useState(false);
  const run = session.untreated;
  const updateConfig = (patch: Partial<Config>) => {
    setSubmitted(false);
    setSession((s) => {
      const next = normalizeConfig({ ...s.config, ...patch });
      return JSON.stringify(next) === JSON.stringify(s.config)
        ? s
        : createSession(next, s.revision + 1, simulationInitial);
    });
  };
  const snapshot = isSimulation
    ? submitted
      ? run
      : simulationInitial
    : current;

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
      .querySelectorAll(".topbar, .page-heading, .kpis, .simulation-setup")
      .forEach((el) => observer.observe(el));
    window.addEventListener("resize", fitScene);
    fitScene();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitScene);
    };
  }, [isSimulation]);
  const [selections, setSelections] = useState<
    Record<"current" | "simulation", string | null>
  >({ current: null, simulation: null });
  const selected = selections[view];
  const setSelected = (id: string | null) =>
    setSelections((previous) => ({ ...previous, [view]: id }));
  const switchView = (next: "current" | "simulation") => {
    if (next === view) return;
    setSession((s) => sessionAction(s, "pause"));
    setDetailsOpen(false);
    setMetric(null);
    setHudVisible(true);
    setView(next);
  };
  const { kind: scenario, target, duration } = session.config;
  const [reset, setReset] = useState(0);
  const [tree, setTree] = useState(false);
  const assets = snapshot.assets;
  const visualScenario =
    isSimulation && submitted && assets.some((a) => a.scenario)
      ? scenario
      : null;
  const inputs = effects(session.config, session.elapsed, false);
  const visualSeverity =
    visualScenario === "fault"
      ? 100
      : 100 * (1 - (Object.values(inputs.dcFactors ?? {})[0] ?? 1));
  const asset = assets.find((a) => a.id === selected);
  const preset = scenarios.find((s) => s.id === scenario);
  const selectScenario = (id: ScenarioId) => {
    setSubmitted(false);
    setSession((s) =>
      createSession(
        {
          ...presetConfig(id),
          duration: s.config.duration,
          interventionMinute: Math.floor(s.config.duration / 2),
        },
        s.revision + 1,
        simulationInitial,
      ),
    );
  };
  const resetSimulation = () => {
    setSession((s) =>
      createSession(initialConfig, s.revision + 1, simulationInitial),
    );
    setSubmitted(false);
    setSelections((previous) => ({ ...previous, simulation: null }));
    setHudVisible(true);
    setDetailsOpen(false);
    setTree(false);
    setReset((n) => n + 1);
  };
  const choose = (id: string) => {
    setSelected(id);
    setHudVisible(true);
    setFocusRequest((n) => n + 1);
  };
  const aiSelection: AnalysisSelection = {
    mode: view,
    assetId: selected,
    revision: isSimulation ? session.revision : current.revision,
    submitted: isSimulation && submitted,
    config: isSimulation ? session.config : initialConfig,
  };
  const liveSelection = useRef(aiSelection);
  liveSelection.current = aiSelection;
  const focusFromChat = (id: string) => {
    if (
      liveSelection.current.mode !== "current" ||
      !current.assets.some((a) => a.id === id)
    )
      return;
    setSelections((previous) => ({ ...previous, current: id }));
    setHudVisible(false);
    setDetailsOpen(false);
    setFocusRequest((n) => n + 1);
  };
  const applyAiAction = (
    value: SimulationAction,
    source: AnalysisSelection,
  ): AnalysisSelection | null => {
    if (!sameSimulationState(liveSelection.current, source)) return null;
    const action = readSimulationAction(value, source);
    const next = selectionAfterAction(action, {
      ...source,
      assetId: liveSelection.current.assetId,
    });
    liveSelection.current = next;
    if (action.type === "reset") resetSimulation();
    else {
      setSession(
        createSession(action.config, next.revision, simulationInitial),
      );
      setSubmitted(action.apply);
      setHudVisible(false);
      setDetailsOpen(false);
    }
    return next;
  };
  const trends = useMemo(() => monitoringMetrics(current), [current]);
  const sparkline = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v !== null);
    const min = Math.min(...valid),
      range = Math.max(...valid) - min || 1;
    return values
      .map(
        (v, i) =>
          `${(i / Math.max(1, values.length - 1)) * 100},${v === null ? 28 : 28 - ((v - min) / range) * 24}`,
      )
      .join(" ");
  };
  return (
    <div className="app-shell">
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
            <div className="plant-identity">
              <h1>
                {plant.name}
                <span>Digital Twin</span>
              </h1>
              <p>{plant.dcMWp} MWp DC · 40 MW AC · Dữ liệu mô phỏng</p>
            </div>
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
          <button
            className="header-devices"
            onClick={() => setTree((v) => !v)}
            aria-label="Mở danh sách thiết bị"
            aria-expanded={tree}
          >
            <Layers3 size={17} />
            <span>Thiết bị</span>
          </button>
        </header>
        <main id="overview">
          {isSimulation ? (
            <SimulationSetup
              initial={simulationInitial}
              onReset={resetSimulation}
              config={session.config}
              submitted={submitted}
              onScenario={selectScenario}
              onChange={updateConfig}
              onSubmit={() => {
                setSubmitted(true);
                setHudVisible(false);
                setDetailsOpen(false);
              }}
            />
          ) : (
            <>
              <section className="kpis" aria-label="Chỉ số hiện trạng nhà máy">
                {[
                  {
                    id: "power" as MetricId,
                    label: "Công suất AC",
                    value: number(current.powerMW!),
                    unit: "MW",
                    note: "Giới hạn AC 40 MW",
                    icon: Zap,
                    history: current.powerHistory,
                  },
                  {
                    id: "energy" as MetricId,
                    label: "Năng lượng tích lũy",
                    value: number(current.energyMWh),
                    unit: "MWh",
                    note: "Lịch sử · 10:00–10:30 ICT",
                    icon: Activity,
                    history: trends.energy,
                  },
                  {
                    id: "availability" as MetricId,
                    label: "Khả dụng thiết bị",
                    value: number(current.availability),
                    unit: "%",
                    note: "7/8 inverter · 1 Cảnh báo, 2 Lưu ý",
                    icon: Cpu,
                    history: trends.availability,
                  },
                  {
                    id: "loss" as MetricId,
                    label: "Tổn thất năng lượng",
                    value: number(current.lossMWh),
                    unit: "MWh",
                    note: "INV-03 dừng · Nhánh 06 giảm nhẹ",
                    icon: Leaf,
                    history: trends.loss,
                  },
                ].map((k) => (
                  <button
                    type="button"
                    className="kpi"
                    key={k.label}
                    aria-haspopup="dialog"
                    onClick={() => setMetric(k.id)}
                  >
                    <div>
                      <span>{k.label}</span>
                      <k.icon size={17} />
                    </div>
                    <strong>
                      {k.value}
                      <small>{k.unit}</small>
                    </strong>
                    <p>{k.note}</p>
                    <span className="kpi-more">Xem chi tiết ↗</span>
                    <svg
                      className="kpi-trend"
                      viewBox="0 0 100 32"
                      aria-hidden="true"
                    >
                      <polyline
                        points={sparkline(k.history)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </button>
                ))}
              </section>
            </>
          )}
          <div
            id="plant-view"
            role="tabpanel"
            aria-labelledby={isSimulation ? "simulation-tab" : "current-tab"}
            className="main-grid"
          >
            <div className="left-column">
              <section ref={scenePanel} className="scene-panel">
                <div className="scene-top">
                  <div>
                    <span className="live-dot" />
                    TỔNG QUAN NHÀ MÁY <span className="scene-tag">3D</span>
                  </div>
                  <button
                    onClick={() => {
                      setReset((n) => n + 1);
                      setHudVisible(false);
                    }}
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
                    scenario={visualScenario}
                    target={target}
                    severity={visualSeverity}
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
                  {isSimulation && submitted && scenario && (
                    <div className="preview-label">
                      Kết quả · {preset?.name}
                      {scenario === "cloud"
                        ? ` · ${session.config.scale ?? 4} cụm pin`
                        : scenario === "dust"
                          ? ` · ${assets.find((a) => a.type === "pv" && a.related.includes(target))?.id ?? target}`
                          : ""}
                      <small>Ảnh hưởng trong {duration / 60} giờ</small>
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
                <p
                  className="power-flow-legend"
                  aria-label="Chú thích đường điện"
                >
                  <span>Đường điện: Pin → Inverter → Trạm</span>
                  <span className="power-normal">
                    <i />
                    Bình thường
                  </span>
                  <span className="power-degraded">
                    <i />
                    Suy giảm
                  </span>
                  <span className="power-stopped">
                    <i />
                    Ngừng phát điện
                  </span>
                  <span>Chấm chạy: có công suất</span>
                </p>
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
            </div>
            <aside className="right-column">
              <AiPanel
                selection={aiSelection}
                onFocus={focusFromChat}
                onAction={applyAiAction}
                onSelect={choose}
                onMention={(id) => {
                  setSelected(id);
                  setHudVisible(false);
                  setDetailsOpen(false);
                }}
                onClear={() => {
                  setSelected(null);
                  setHudVisible(false);
                  setDetailsOpen(false);
                }}
              />
            </aside>
          </div>
          {metric && !isSimulation && (
            <MetricDialog
              metric={metric}
              snapshot={current}
              onClose={() => setMetric(null)}
              onSelectDevice={(id) => {
                setMetric(null);
                choose(id);
                scenePanel.current?.scrollIntoView({
                  block: "start",
                  behavior: "instant",
                });
              }}
            />
          )}
          <footer>
            <span>
              <Sun size={15} />
              SOLAR FARM ONE <b>/</b> DIGITAL TWIN
            </span>
            <p>
              Không kết nối nhà máy thật · Không điều khiển thiết bị · AI chỉ tư
              vấn
            </p>
            <span>GIAI ĐOẠN T03</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
