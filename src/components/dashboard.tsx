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
  Settings2,
  Sun,
  Wind,
  Zap,
  MessageCircle,
  Send,
} from "lucide-react";
import { plant, scenarios, ScenarioId, typeNames } from "@/data/plant";
import { DeviceHud, DeviceDialog, Trend, number } from "./device-profile";
const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
import { createRun, timeLabel } from "@/lib/simulation";
import { assetStatus } from "@/lib/asset-status";
import {
  createSession,
  sessionAction,
  presetConfig,
  normalizeConfig,
  effects,
  type Config,
} from "@/lib/scenario-simulation";
import { SimulationSetup } from "./simulation-setup";
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
  const [session, setSession] = useState(() =>
    createSession({
      kind: null,
      target: "INV-01",
      scale: 1,
      severity: 45,
      duration: 60,
      intervention: false,
      interventionMinute: 30,
      recovery: 100,
    }),
  );
  const [submitted, setSubmitted] = useState(false);
  const run = session.untreated;
  const updateConfig = (patch: Partial<Config>) => {
    setSubmitted(false);
    setSession((s) => {
      const next = normalizeConfig({ ...s.config, ...patch });
      return JSON.stringify(next) === JSON.stringify(s.config)
        ? s
        : createSession(next, s.revision + 1);
    });
  };
  const snapshot = isSimulation && submitted ? run : current;
  const { powerHistory } = snapshot;
  const timestamp = `${timeLabel(snapshot.sampledAt)} ICT`;

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
  >({ current: "INV-01", simulation: "INV-01" });
  const selected = selections[view];
  const setSelected = (id: string | null) =>
    setSelections((previous) => ({ ...previous, [view]: id }));
  const switchView = (next: "current" | "simulation") => {
    if (next === view) return;
    setSession((s) => sessionAction(s, "pause"));
    setDetailsOpen(false);
    setHudVisible(true);
    setView(next);
  };
  const { kind: scenario, target, duration } = session.config;
  const [reset, setReset] = useState(0);
  const [tree, setTree] = useState(false);
  const assets = snapshot.assets;
  const attentionAssets = assets.filter((a) => a.attention || a.scenario);
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
      ),
    );
  };
  const choose = (id: string) => {
    setSelected(id);
    setHudVisible(true);
    setFocusRequest((n) => n + 1);
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
          {isSimulation ? (
            <SimulationSetup
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
                    label: "Công suất AC",
                    value: number(current.powerMW!),
                    unit: "MW",
                    note: "Giới hạn AC 40 MW",
                    icon: Zap,
                  },
                  {
                    label: "Năng lượng tích lũy",
                    value: number(current.energyMWh),
                    unit: "MWh",
                    note: "Snapshot mẫu · chưa tích lũy",
                    icon: Activity,
                  },
                  {
                    label: "Khả dụng thiết bị",
                    value: number(current.availability),
                    unit: "%",
                    note: "Theo trạng thái mô hình · độc lập IoT",
                    icon: Cpu,
                  },
                  {
                    label: "Tổn thất năng lượng",
                    value: number(current.lossMWh),
                    unit: "MWh",
                    note: "Snapshot cơ sở · chưa có sự kiện",
                    icon: Leaf,
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
              {!isSimulation && (
                <section className="panel chart-panel">
                  <h2>Công suất hiện trạng</h2>
                  <Trend
                    values={powerHistory}
                    times={snapshot.times}
                    unit="MW"
                    label="Công suất hiện trạng"
                  />
                  <p className="subtle">
                    Hiện trạng mẫu cố định · không kết nối nhà máy thật. Mô
                    phỏng không thay đổi dữ liệu tại đây.
                  </p>
                </section>
              )}
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
              {!isSimulation && (
                <>
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
                    <div
                      className="attention-list"
                      aria-label="Thiết bị cần chú ý"
                    >
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
                </>
              )}
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
            <span>GIAI ĐOẠN T02</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
