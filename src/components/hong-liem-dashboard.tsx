"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Eye,
  Focus,
  Layers3,
  RotateCcw,
  Search,
  Sun,
  X,
  Zap,
} from "lucide-react";
import {
  createHongLiemSnapshot,
  hongLiemPlant,
  initialHongLiemConfig,
  type HongLiemConfig,
  type HongLiemScenario,
} from "@/lib/hong-liem-simulation";
import { hongLiemFields } from "@/data/hong-liem-layout";

const Scene = dynamic(() => import("./hong-liem-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
const number = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const scenarioNames: Record<HongLiemScenario, string> = {
  none: "Không áp dụng",
  cloud: "Mây che · giảm bức xạ 35%",
  dust: "Bám bụi · giảm thu nhận 15%",
  fault: "Lỗi inverter · ngừng phát điện",
};
const statusNames = {
  normal: "Bình thường",
  degraded: "Suy giảm nhẹ",
  stopped: "Dừng phát điện",
};

export default function HongLiemDashboard() {
  const [mode, setMode] = useState<"current" | "simulation">("current");
  const [draft, setDraft] = useState<HongLiemConfig>({
    ...initialHongLiemConfig,
    scenario: "cloud",
  });
  const [applied, setApplied] = useState<HongLiemConfig | null>(null);
  const current = useMemo(() => createHongLiemSnapshot(), []);
  const simulation = useMemo(
    () => createHongLiemSnapshot(applied ?? initialHongLiemConfig),
    [applied],
  );
  const snapshot = mode === "current" ? current : simulation;
  const [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const [view, setView] = useState<"photo" | "top">("photo"),
    [reset, setReset] = useState(0),
    [focus, setFocus] = useState(0),
    [labels, setLabels] = useState(true);
  const reading = snapshot.fields.find(
    (field) => field.id === selected || field.inverterId === selected,
  );
  const isInverter = Boolean(reading && reading.inverterId === selected);
  const deviceName = reading
    ? `${isInverter ? "Inverter" : "Vùng pin"} · ${reading.name}`
    : selected === "HL3-TR-01"
      ? "Trạm điện trung tâm"
      : selected === "HL3-MET-01"
        ? "Trạm thời tiết"
        : selected === "HL3-GW-01"
          ? "Gateway IoT"
          : null;
  const changeDraft = (patch: Partial<HongLiemConfig>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setApplied(null);
  };
  const resetSimulation = () => {
    setDraft({ ...initialHongLiemConfig, scenario: "cloud" });
    setApplied(null);
  };
  const visibleFields = snapshot.fields.filter((field) =>
    `${field.id} ${field.inverterId} ${field.name}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  const stopCount = snapshot.fields.filter(
    (f) => f.status === "stopped",
  ).length;
  const details = reading
    ? [
        ["Công suất DC danh định", `${number(reading.dcMWp)} MWp`],
        [
          isInverter ? "Đầu ra AC" : "Công suất DC",
          `${number(isInverter ? reading.powerMW : reading.dcPowerMW)} MW`,
        ],
        ["Bức xạ tại vùng", `${number(reading.irradiance)} W/m²`],
        [
          isInverter ? "Nhiệt độ inverter" : "Nhiệt độ module",
          `${number(reading.temperature + (isInverter ? 4 : 0))} °C`,
        ],
        ["Năng lượng AC trong kỳ", `${number(reading.energyMWh)} MWh`],
        ["Tổn thất phát sinh thêm", `${number(reading.lossMWh)} MWh`],
      ]
    : selected === "HL3-TR-01"
      ? [
          ["Tổng công suất AC", `${number(snapshot.powerMW)} MW`],
          ["Giới hạn AC giả định", "40 MW"],
          ["Cấp điện áp tham khảo", "22/110 kV"],
          ["Nhiệt độ cuộn dây", "57 °C"],
        ]
      : selected === "HL3-MET-01"
        ? [
            ["Bức xạ mặt phẳng pin", `${number(snapshot.irradiance)} W/m²`],
            ["Nhiệt độ môi trường", "28 °C"],
            ["Tốc độ gió", "2,6 m/s"],
          ]
        : [
            ["Độ trễ dữ liệu", "240 ms"],
            ["Nguồn giám sát", "27 thiết bị/vùng đại diện"],
            ["Chất lượng dữ liệu", "Hợp lệ"],
          ];

  return (
    <div className="hl3-shell">
      <header className="hl3-header">
        <div className="hl3-brand">
          <Link
            href="/"
            className="plant-directory-back"
            aria-label="Về danh sách nhà máy"
          >
            <ArrowLeft size={18} />
          </Link>
          <Image
            src="/brand/sava-logo.png"
            alt="SAVA — GOOD TO GREAT"
            width={66}
            height={52}
            unoptimized
          />
          <div>
            <h1>
              {hongLiemPlant.name}
              <span>Digital Twin</span>
            </h1>
            <p>Nhà máy điện mặt trời · 50 MWp DC</p>
          </div>
        </div>
        <div className="hl3-mode" aria-label="Chế độ nhà máy">
          <button
            aria-pressed={mode === "current"}
            onClick={() => setMode("current")}
          >
            Hiện trạng
          </button>
          <button
            aria-pressed={mode === "simulation"}
            onClick={() => setMode("simulation")}
          >
            Mô phỏng
          </button>
        </div>
        <span className="hl3-source">
          <Box size={15} />
          Dữ liệu giả định
        </span>
      </header>
      <main className="hl3-main">
        <div className="hl3-context">
          <span>
            <span className="hl3-location-dot" />
            Hồng Liêm 3 · Bố cục dựng theo ảnh tham chiếu
          </span>
          <span>Kích thước, cao độ và vị trí thiết bị là ước lượng.</span>
        </div>
        {mode === "simulation" && (
          <section
            className="hl3-simulation"
            aria-label="Thiết lập mô phỏng Hồng Liêm 3"
          >
            <div className="hl3-sim-title">
              <Sun size={19} />
              <div>
                <h2>Thử kịch bản vận hành</h2>
                <p>Đầu vào cố định trong toàn bộ thời lượng đã chọn.</p>
              </div>
            </div>
            <div className="hl3-sim-controls">
              <label>
                Kịch bản
                <select
                  value={draft.scenario}
                  onChange={(event) =>
                    changeDraft({
                      scenario: event.target.value as HongLiemScenario,
                    })
                  }
                >
                  {Object.entries(scenarioNames).map(([id, name]) => (
                    <option value={id} key={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vùng ảnh hưởng
                <select
                  value={draft.target}
                  onChange={(event) =>
                    changeDraft({ target: event.target.value })
                  }
                >
                  <option value="all">Toàn nhà máy</option>
                  {hongLiemFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bức xạ nền (W/m²)
                <select
                  value={draft.irradiance}
                  onChange={(event) =>
                    changeDraft({ irradiance: Number(event.target.value) })
                  }
                >
                  {[400, 600, 780, 1000].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Thời lượng
                <select
                  value={draft.durationHours}
                  onChange={(event) =>
                    changeDraft({ durationHours: Number(event.target.value) })
                  }
                >
                  {[1, 2, 4, 8, 12, 24].map((value) => (
                    <option key={value} value={value}>
                      {value} giờ
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="hl3-primary"
                onClick={() => setApplied({ ...draft })}
              >
                Xem kết quả mô phỏng
                <ArrowUpRight size={16} />
              </button>
              <button
                className="hl3-reset"
                onClick={resetSimulation}
                aria-label="Đặt lại mô phỏng"
              >
                <RotateCcw size={17} />
              </button>
            </div>
            <p className="hl3-sim-state" role="status">
              {applied
                ? `Đã áp dụng: ${scenarioNames[applied.scenario]} · ${snapshot.durationHours} giờ. Các kết quả là ước tính trong kỳ, không cộng vào Hiện trạng.`
                : "Chọn đầu vào và bấm Xem kết quả mô phỏng để áp dụng. Đang hiển thị trạng thái ban đầu."}
            </p>
          </section>
        )}
        <section className="hl3-kpis" aria-label="Chỉ số nhà máy Hồng Liêm 3">
          <div>
            <span>
              Công suất AC <Zap size={15} />
            </span>
            <strong data-testid="hl3-power">
              {number(snapshot.powerMW)}
              <small>MW</small>
            </strong>
            <p>Giới hạn AC giả định 40 MW</p>
          </div>
          <div>
            <span>Năng lượng trong {snapshot.durationHours} giờ</span>
            <strong data-testid="hl3-energy">
              {number(snapshot.energyMWh)}
              <small>MWh</small>
            </strong>
            <p>Tính theo công suất không đổi trong kỳ</p>
          </div>
          <div>
            <span>Khả dụng inverter</span>
            <strong>
              {number(snapshot.availability)}
              <small>%</small>
            </strong>
            <p>{12 - stopCount}/12 inverter đại diện có thể phát điện</p>
          </div>
          <div>
            <span>Tổn thất phát sinh thêm</span>
            <strong data-testid="hl3-loss">
              {number(snapshot.lossMWh)}
              <small>MWh</small>
            </strong>
            <p>So với cùng bức xạ, chưa áp dụng kịch bản</p>
          </div>
        </section>
        <div className="hl3-workspace">
          <section
            className="hl3-scene-panel"
            aria-labelledby="hl3-scene-title"
          >
            <div className="hl3-scene-heading">
              <h2 id="hl3-scene-title">
                <Layers3 size={16} />
                Tổng quan nhà máy <span>3D</span>
              </h2>
              <div className="hl3-scene-actions">
                <button
                  onClick={() => {
                    setView("photo");
                    setReset((n) => n + 1);
                  }}
                  aria-label="Góc nhìn theo ảnh"
                  aria-pressed={view === "photo"}
                >
                  <Eye size={16} />
                  <span>Theo ảnh</span>
                </button>
                <button
                  onClick={() => {
                    setView("top");
                    setReset((n) => n + 1);
                  }}
                  aria-label="Góc nhìn từ trên"
                  aria-pressed={view === "top"}
                >
                  <Layers3 size={16} />
                  <span>Từ trên</span>
                </button>
                <button
                  onClick={() => setLabels((value) => !value)}
                  aria-label="Hiện nhãn vùng"
                  aria-pressed={labels}
                >
                  <Box size={16} />
                </button>
              </div>
            </div>
            <div className="hl3-canvas">
              <Scene
                snapshot={snapshot}
                selected={selected}
                onSelect={setSelected}
                view={view}
                reset={reset}
                focus={focus}
                labels={labels}
              />
              <div className="hl3-scene-legend">
                <span>
                  <i className="normal" />
                  Bình thường
                </span>
                <span>
                  <i className="degraded" />
                  Suy giảm
                </span>
                <span>
                  <i className="stopped" />
                  Dừng phát
                </span>
              </div>
            </div>
            <div className="hl3-scene-footer">
              <span>Kéo để xoay · Cuộn để zoom · Chọn vùng để xem dữ liệu</span>
              <span>12 vùng pin đại diện</span>
            </div>
          </section>
          <aside
            className="hl3-sidebar"
            aria-label="Dữ liệu và thiết bị Hồng Liêm 3"
          >
            {selected && deviceName && (
              <section className="hl3-detail" aria-label="Chi tiết thiết bị">
                <div className="hl3-detail-heading">
                  <div>
                    <p>{selected}</p>
                    <h2>{deviceName}</h2>
                  </div>
                  <button
                    aria-label="Đóng chi tiết thiết bị"
                    onClick={() => setSelected(null)}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="hl3-device-status">
                  <span className={reading?.status ?? "normal"}>
                    {reading ? statusNames[reading.status] : "Bình thường"}
                  </span>
                  <span>IoT · Đang kết nối</span>
                </div>
                <dl>
                  {details.map(([name, value]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                {reading && (
                  <>
                    <p className="hl3-related">
                      {isInverter ? "Nhận từ" : "Cấp vào"}:{" "}
                      {isInverter ? reading.id : reading.inverterId}
                    </p>
                    <button
                      className="hl3-focus"
                      onClick={() => {
                        setSelected(reading.id);
                        setFocus((n) => n + 1);
                      }}
                    >
                      <Focus size={15} />
                      Phóng tới vùng trong 3D
                    </button>
                  </>
                )}
                {reading?.status === "stopped" && (
                  <p className="hl3-device-note">
                    Inverter ngừng phát theo kịch bản; telemetry vẫn đang kết
                    nối.
                  </p>
                )}
              </section>
            )}
            <section
              className="hl3-regions"
              aria-labelledby="hl3-regions-title"
            >
              <div className="hl3-list-heading">
                <h2 id="hl3-regions-title">Vùng pin & thiết bị</h2>
                <span>{hongLiemPlant.fixtureTime}</span>
              </div>
              <label className="hl3-search">
                <Search size={16} />
                <input
                  aria-label="Tìm vùng hoặc inverter"
                  placeholder="Tìm tên vùng, mã thiết bị…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="hl3-region-list">
                {visibleFields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`hl3-region ${selected === field.id || selected === field.inverterId ? "selected" : ""}`}
                  >
                    <button
                      className="hl3-region-button"
                      aria-label={`Xem vùng ${field.name}`}
                      aria-pressed={selected === field.id}
                      onClick={() => setSelected(field.id)}
                    >
                      <span className={`hl3-region-number ${field.status}`}>
                        {field.id.slice(-2)}
                      </span>
                      <span>
                        <strong>{field.name}</strong>
                        <small>
                          {number(field.dcMWp)} MWp · {field.id}
                        </small>
                      </span>
                      <b>
                        {number(field.powerMW)}
                        <small>MW AC</small>
                      </b>
                    </button>
                    <button
                      className="hl3-inverter-link"
                      aria-label={`Xem inverter ${field.inverterId}`}
                      onClick={() => setSelected(field.inverterId)}
                    >
                      {field.inverterId}
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                ))}
                {!visibleFields.length && (
                  <p className="hl3-empty">Không tìm thấy vùng phù hợp.</p>
                )}
              </div>
              <div className="hl3-aux-devices">
                {[
                  ["HL3-TR-01", "Trạm điện"],
                  ["HL3-MET-01", "Thời tiết"],
                  ["HL3-GW-01", "Gateway"],
                ].map(([id, name]) => (
                  <button
                    key={id}
                    aria-pressed={selected === id}
                    onClick={() => setSelected(id)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
        <details className="hl3-assumptions">
          <summary>Cơ sở dựng hình và dữ liệu giả định</summary>
          <p>
            Đường bao 12 vùng pin, khoảng đất trống trung tâm, các cụm tách rời
            và đường nội bộ được phác theo ảnh góc xiên 640 × 425 do bạn cung
            cấp. Phối cảnh được quy đổi về mặt phẳng ước lượng; chưa có tỷ lệ,
            cao độ hoặc bản vẽ khảo sát để xác nhận kích thước thực tế. Các mô
            hình pin, inverter, trạm điện, nhà điều hành, đường, hàng rào và cây
            được dùng lại từ Sava. Các dãy pin là đại diện, không phải số lượng
            module thực tế.
          </p>
          <p>
            Công suất DC 50 MWp là thông tin công khai của dự án; giới hạn AC 40
            MW, phân bổ 12 vùng, số thiết bị, vị trí và các số đo là giả định
            của bản mô phỏng. Vùng Đông trung tâm có hệ số thu nhận ban đầu 97%.
            Công suất tính từ bức xạ, hệ số nhiệt −0,4%/°C và hiệu suất inverter
            97%; năng lượng bằng công suất nhân thời lượng. Không có kết nối IoT
            hoặc dữ liệu vận hành thật. Bộ dữ liệu này độc lập với Sava.
          </p>
        </details>
      </main>
    </div>
  );
}
