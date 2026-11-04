"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Focus,
  CalendarDays,
  Layers3,
} from "lucide-react";
import { assets } from "@/data/plant";
import { historyBranches } from "@/data/history-model";
import {
  datesInRange,
  historyPreset,
  historyWindow,
  previousPeriod,
  shiftDate,
  validateHistoryRange,
  type DateRange,
  type HistoryPreset,
} from "@/lib/history-dates";
import {
  createPerformanceHistory,
  historyRange,
  type EnergySummary,
  type PerformanceHistory,
} from "@/lib/performance-history";
import {
  compareHistory,
  heatmapColor,
  HISTORY_DAILY_ENERGY_MAX,
  performanceStops,
  type HeatmapMetric,
  type HeatmapReading,
} from "@/lib/history-presentation";
import { HistoryChart } from "./history-chart";

const PlantScene = dynamic(() => import("./plant-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">Đang tải trình xem 3D…</div>,
});
const format = (n: number | null, digits = 2) =>
  n === null
    ? "—"
    : n.toLocaleString("vi-VN", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
const dayLabel = (date: string) => date.split("-").reverse().join("/");
const rangeLabel = (range: DateRange) =>
  range.start === range.end
    ? dayLabel(range.start)
    : `${dayLabel(range.start)} – ${dayLabel(range.end)}`;
const qualityLabel = (summary: EnergySummary) =>
  summary.quality === "complete"
    ? "Đủ dữ liệu"
    : summary.quality === "missing"
      ? "Không có dữ liệu"
      : "Dữ liệu một phần";
const presets: { id: HistoryPreset; label: string }[] = [
  { id: "1d", label: "1 ngày" },
  { id: "3d", label: "3 ngày" },
  { id: "7d", label: "7 ngày" },
  { id: "all", label: "Tất cả" },
];
type ViewState = {
  data: PerformanceHistory;
  range: DateRange;
  preset: HistoryPreset | "custom";
  day: string | null;
  assetId: string | null;
};

function RangeForm({
  value,
  min,
  max,
  label,
  onApply,
}: {
  value: DateRange;
  min: string;
  max: string;
  label: string;
  onApply: (range: DateRange) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const id = label === "Khoảng phân tích" ? "primary" : "comparison";
  useEffect(() => {
    setDraft(value);
    setError("");
  }, [value]);
  return (
    <form
      className="history-date-form"
      aria-label={label}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        try {
          validateHistoryRange(draft, {
            start: min,
            end: max,
            today: shiftDate(max, 1),
            timezone: "Asia/Bangkok",
          });
          setError("");
          onApply(draft);
        } catch {
          setError(
            "Chọn ngày từ " +
              dayLabel(min) +
              " đến " +
              dayLabel(max) +
              "; ngày kết thúc không trước ngày bắt đầu.",
          );
        }
      }}
    >
      <label>
        Từ ngày
        <input
          type="date"
          aria-label={`${label}: từ ngày`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-date-error` : undefined}
          min={min}
          max={max}
          value={draft.start}
          onChange={(e) => setDraft({ ...draft, start: e.target.value })}
        />
      </label>
      <label>
        Đến ngày
        <input
          type="date"
          aria-label={`${label}: đến ngày`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-date-error` : undefined}
          min={min}
          max={max}
          value={draft.end}
          onChange={(e) => setDraft({ ...draft, end: e.target.value })}
        />
      </label>
      <button type="submit" className="history-apply">
        Áp dụng
      </button>
      {error && (
        <p id={`${id}-date-error`} className="history-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function HistoryComparison({
  data,
  scope,
  assetId,
}: {
  data: PerformanceHistory;
  scope: DateRange;
  assetId: string | null;
}) {
  const [mode, setMode] = useState<"previous" | "custom">("previous");
  const [custom, setCustom] = useState<DateRange>(previousPeriod(scope));
  const range = mode === "previous" ? previousPeriod(scope) : custom;
  const result = compareHistory(data, scope, range, assetId ?? undefined);
  return (
    <section
      className="history-comparison history-panel"
      aria-labelledby="history-compare-title"
    >
      <div className="history-section-title">
        <div>
          <span className="history-eyebrow">ĐỐI CHIẾU VẬN HÀNH</span>
          <h2 id="history-compare-title">So sánh thời gian</h2>
        </div>
        <label className="history-compare-select">
          Kỳ đối chiếu
          <select
            aria-label="Chọn kỳ đối chiếu"
            value={mode}
            onChange={(e) => {
              const next = e.target.value as typeof mode;
              setMode(next);
              if (next === "custom") setCustom(previousPeriod(scope));
            }}
          >
            <option value="previous">Kỳ liền trước</option>
            <option value="custom">Tùy chọn</option>
          </select>
        </label>
      </div>
      <p className="history-muted">
        Đang xem {rangeLabel(scope)} · {assetId ?? "Toàn nhà máy"}
      </p>
      {mode === "custom" && (
        <RangeForm
          label="Khoảng đối chiếu"
          value={custom}
          min={data.window.start}
          max={data.window.end}
          onApply={setCustom}
        />
      )}
      {!result.available ? (
        <p className="history-empty" role="status">
          {result.reason}
        </p>
      ) : (
        <>
          <div className="history-compare-columns">
            {[
              {
                title: "Kỳ đang xem",
                range: scope,
                summary: result.primary.summary,
                days: result.primaryDays,
                mean: result.primaryDailyMWh,
              },
              {
                title: "Kỳ đối chiếu",
                range,
                summary: result.comparison.summary,
                days: result.comparisonDays,
                mean: result.comparisonDailyMWh,
              },
            ].map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>
                  {rangeLabel(item.range)} <span>({item.days} ngày)</span>
                </p>
                <dl>
                  <div>
                    <dt>Sản lượng ghi nhận</dt>
                    <dd>
                      {format(item.summary.actualEnergyMWh)} <small>MWh</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Bình quân / ngày</dt>
                    <dd>
                      {format(item.mean)} <small>MWh/ngày</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Đạt kỳ vọng</dt>
                    <dd>
                      {format(item.summary.performancePct)} <small>%</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Độ phủ dữ liệu</dt>
                    <dd>
                      {format(item.summary.coveragePct, 1)} <small>%</small>
                    </dd>
                  </div>
                </dl>
                <span className={`history-quality ${item.summary.quality}`}>
                  {qualityLabel(item.summary)}
                </span>
              </div>
            ))}
          </div>
          <div
            className="history-comparison-delta"
            aria-label="Chênh lệch giữa hai kỳ"
          >
            <span>
              Bình quân sản lượng/ngày{" "}
              <strong>
                {result.dailyEnergyChangePct === null
                  ? "—"
                  : `${result.dailyEnergyChangePct >= 0 ? "+" : ""}${format(result.dailyEnergyChangePct)}%`}
              </strong>
            </span>
            <span>
              Tỷ lệ đạt kỳ vọng{" "}
              <strong>
                {result.performanceChangePoints === null
                  ? "—"
                  : `${result.performanceChangePoints >= 0 ? "+" : ""}${format(result.performanceChangePoints)} điểm %`}
              </strong>
            </span>
          </div>
          {result.primaryDays !== result.comparisonDays && (
            <p className="history-muted">
              Hai kỳ khác số ngày; dùng sản lượng bình quân/ngày để đối chiếu.
            </p>
          )}
          {(result.primary.summary.quality !== "complete" ||
            result.comparison.summary.quality !== "complete") && (
            <p className="history-muted">
              Có dữ liệu chưa đầy đủ. Sản lượng chỉ là phần ghi nhận; không tính
              % thay đổi sản lượng. Tỷ lệ đạt kỳ vọng dùng đúng phần thời gian
              có số liệu.
            </p>
          )}
          <p className="history-muted">
            Thời tiết giữa hai kỳ có thể khác nhau. Chênh lệch sản lượng không
            tự xác định nguyên nhân suy giảm thiết bị.
          </p>
        </>
      )}
    </section>
  );
}

export function PerformanceDashboard({
  active,
  showAssets,
  onToggleAssets,
}: {
  active: boolean;
  showAssets: boolean;
  onToggleAssets: () => void;
}) {
  const [state, setState] = useState<ViewState | null>(null);
  const [metric, setMetric] = useState<HeatmapMetric>("performance");
  const [reset, setReset] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      const window = historyWindow(now);
      setState((previous) => {
        if (previous?.data.window.today === window.today) return previous;
        const data = createPerformanceHistory({ now });
        const preset = previous?.preset ?? "7d";
        const range =
          preset === "custom" && previous
            ? {
                start:
                  previous.range.start < window.start
                    ? window.start
                    : previous.range.start,
                end:
                  previous.range.end > window.end
                    ? window.end
                    : previous.range.end,
              }
            : historyPreset(preset === "custom" ? "7d" : preset, window);
        if (range.start > range.end)
          Object.assign(range, historyPreset("1d", window));
        return {
          data,
          range,
          preset,
          assetId: previous?.assetId ?? null,
          day:
            previous?.day &&
            previous.day >= range.start &&
            previous.day <= range.end
              ? previous.day
              : null,
        };
      });
      const nextMidnight = Date.parse(
        `${shiftDate(window.today, 1)}T00:00:00+07:00`,
      );
      timer = setTimeout(
        refresh,
        Math.min(60_000, Math.max(25, nextMidnight - now.getTime() + 25)),
      );
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [active]);

  const data = state?.data;
  const scope = state
    ? state.day
      ? { start: state.day, end: state.day }
      : state.range
    : null;
  const allScope = useMemo(
    () => (data && scope ? historyRange(data, scope) : null),
    [data, scope?.start, scope?.end],
  );
  const selectedScope = useMemo(
    () =>
      data && scope
        ? historyRange(data, scope, state?.assetId ?? undefined)
        : null,
    [data, scope?.start, scope?.end, state?.assetId],
  );
  const chart = useMemo(
    () =>
      data && state
        ? historyRange(data, state.range, state.assetId ?? undefined)
        : null,
    [data, state?.range.start, state?.range.end, state?.assetId],
  );
  const scopeDays = scope ? datesInRange(scope).length : 1;
  const heatmap = useMemo(
    () =>
      Object.fromEntries(
        (allScope?.byAsset ?? []).map((row) => {
          const value =
            metric === "energy" ? row.actualEnergyMWh : row.performancePct;
          return [
            row.assetId,
            {
              color: heatmapColor(value, metric, scopeDays),
              label: `${format(value)} ${metric === "energy" ? "MWh AC" : "% kỳ vọng"} · ${qualityLabel(row)}`,
              quality: row.quality,
              coveragePct: row.coveragePct,
            } satisfies HeatmapReading,
          ];
        }),
      ),
    [allScope, metric, scopeDays],
  );

  if (!state || !data || !scope || !allScope || !selectedScope || !chart)
    return active ? <p role="status">Đang chuẩn bị lịch sử vận hành…</p> : null;
  const { range, day, assetId } = state;
  const summary = selectedScope.summary;
  const dates = datesInRange(range);
  const index = day ? dates.indexOf(day) : 0;
  const chooseDay = (date: string) =>
    setState((s) => (s ? { ...s, day: date } : s));
  const chooseAsset = (id: string | null) => {
    setState((s) => (s ? { ...s, assetId: id } : s));
    setFocusRequest((n) => n + 1);
  };
  const chooseRange = (range: DateRange, preset: ViewState["preset"]) =>
    setState((s) => (s ? { ...s, range, preset, day: null } : s));
  const row = assetId
    ? allScope.byAsset.find((row) => row.assetId === assetId)
    : null;
  const events = assetId
    ? data.days
        .filter(
          (d) =>
            d.assetId === assetId &&
            d.date >= scope.start &&
            d.date <= scope.end,
        )
        .flatMap((d) => d.events.map((event) => ({ date: d.date, ...event })))
    : [];
  const situations = [
    ...new Map(
      data.days
        .filter((d) => d.date >= range.start && d.date <= range.end)
        .flatMap((d) =>
          d.events.map((event) => ({
            ...event,
            date: d.date,
            assetId: d.assetId,
          })),
        )
        .map((event) => [`${event.assetId}:${event.kind}`, event] as const),
    ).values(),
  ]
    .sort((a, b) => {
      const rank = (kind: string) =>
        kind === "inverter-stop" ? 0 : kind === "data-gap" ? 1 : 2;
      return rank(a.kind) - rank(b.kind);
    })
    .slice(0, 4);
  return (
    <div
      className="history-dashboard"
      data-testid="history-dashboard"
      data-today={data.window.today}
      data-scope-start={scope.start}
      data-scope-end={scope.end}
      data-selected-asset={assetId ?? "plant"}
    >
      <section
        className="history-toolbar history-panel"
        aria-labelledby="history-title"
      >
        <div className="history-section-title">
          <div>
            <span className="history-eyebrow">LỊCH SỬ VẬN HÀNH</span>
            <h2 id="history-title">Hiệu suất hệ thống</h2>
            <p>Dữ liệu từ {rangeLabel(data.window)} · UTC+7</p>
          </div>
          <CalendarDays size={25} aria-hidden="true" />
        </div>
        <div className="history-filter-row">
          <div
            className="history-presets"
            role="group"
            aria-label="Khoảng thời gian chọn nhanh"
          >
            {presets.map((p) => (
              <button
                key={p.id}
                aria-pressed={state.preset === p.id}
                onClick={() =>
                  chooseRange(historyPreset(p.id, data.window), p.id)
                }
              >
                {p.label}
              </button>
            ))}
            <button
              aria-pressed={state.preset === "custom"}
              onClick={() => setState({ ...state, preset: "custom" })}
            >
              Tùy chọn
            </button>
          </div>
          {state.preset === "custom" && (
            <RangeForm
              label="Khoảng phân tích"
              value={range}
              min={data.window.start}
              max={data.window.end}
              onApply={(range) => chooseRange(range, "custom")}
            />
          )}
        </div>
        <section
          className="history-panel history-timeline"
          aria-label="Timeline theo ngày"
        >
          <div className="history-timeline-heading">
            <div>
              <h3>
                {day
                  ? `Đang xem ngày ${dayLabel(day)}`
                  : "Đang xem toàn khoảng"}
              </h3>
              <p>
                {rangeLabel(range)} · {dates.length} ngày
              </p>
            </div>
            <button
              aria-pressed={!day}
              onClick={() => setState({ ...state, day: null })}
            >
              Toàn khoảng
            </button>
          </div>
          <div className="history-slider-row">
            <button
              aria-label="Ngày trước"
              disabled={Boolean(day) && index === 0}
              onClick={() =>
                chooseDay(
                  dates[day ? Math.max(0, index - 1) : dates.length - 1],
                )
              }
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="range"
              min="0"
              max={dates.length - 1}
              step="1"
              value={index}
              aria-label="Chọn ngày trên timeline"
              aria-valuetext={
                day
                  ? dayLabel(day)
                  : `Toàn khoảng; kéo để chọn một trong ${dates.length} ngày`
              }
              onChange={(e) => chooseDay(dates[Number(e.target.value)])}
              onKeyDown={(e) => {
                if (!day && e.key === "Home") chooseDay(dates[0]);
              }}
            />
            <button
              aria-label="Ngày sau"
              disabled={Boolean(day) && index === dates.length - 1}
              onClick={() =>
                chooseDay(
                  dates[day ? Math.min(dates.length - 1, index + 1) : 0],
                )
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="history-timeline-endpoints">
            <span>{dayLabel(range.start)}</span>

            <span>{dayLabel(range.end)}</span>
          </div>
        </section>
      </section>

      <div className="history-scope" role="status">
        <strong>
          {day ? `Ngày ${dayLabel(day)}` : `Toàn khoảng ${rangeLabel(range)}`}
        </strong>
        <span>
          {assetId ? `${assetId} · ${row?.area}` : "Toàn nhà máy · 8 cụm pin"}
        </span>
        <span className={`history-quality ${summary.quality}`}>
          {qualityLabel(summary)} · Độ phủ {format(summary.coveragePct, 1)}%
        </span>
      </div>
      <section className="history-kpis" aria-label="Chỉ số hiệu suất lịch sử">
        {[
          {
            id: "energy",
            title:
              summary.quality === "complete"
                ? "Sản lượng ghi nhận"
                : "Sản lượng ghi nhận một phần",
            value: summary.actualEnergyMWh,
            unit: "MWh AC",
            note: "Tổng phần có số liệu hợp lệ",
          },
          {
            id: "expected",
            title: "Thiếu hụt so với kỳ vọng",
            value: summary.shortfallMWh,
            unit: "MWh AC",
            note: "Chỉ tính trên phần dữ liệu hợp lệ",
          },
          {
            id: "performance",
            title: "Đạt kỳ vọng",
            value: summary.performancePct,
            unit: "%",
            note: `Cùng phần dữ liệu · ${format(summary.matchedExpectedEnergyMWh)} MWh kỳ vọng`,
          },
        ].map((kpi) => (
          <article
            key={kpi.id}
            className="history-kpi"
            data-testid={`history-kpi-${kpi.id}`}
          >
            <span>{kpi.title}</span>
            <strong>
              {format(kpi.value)} <small>{kpi.unit}</small>
            </strong>
            <p>{kpi.note}</p>
          </article>
        ))}
      </section>

      <div className="history-scene-grid">
        <section
          className="history-panel history-scene-panel"
          aria-label="Bản đồ hiệu suất 3D"
        >
          <div className="history-scene-top">
            <h3>
              Phân bố theo cụm pin <span>3D</span>
            </h3>
            <button onClick={() => setReset((n) => n + 1)}>
              <Focus size={15} />
              Góc nhìn tổng quan
            </button>
          </div>
          <div
            className="history-metric-switch"
            role="group"
            aria-label="Chỉ số heatmap"
          >
            <button
              aria-pressed={metric === "energy"}
              onClick={() => setMetric("energy")}
            >
              Sản lượng · MWh
            </button>
            <button
              aria-pressed={metric === "performance"}
              onClick={() => setMetric("performance")}
            >
              Đạt kỳ vọng · %
            </button>
          </div>
          <label>
            Phạm vi
            <select
              aria-label="Chọn cụm pin lịch sử"
              value={assetId ?? ""}
              onChange={(e) => chooseAsset(e.target.value || null)}
            >
              <option value="">Toàn nhà máy</option>
              {historyBranches.map((b) => (
                <option key={b.assetId} value={b.assetId}>
                  {b.assetId} · {b.area}
                </option>
              ))}
            </select>
          </label>
          <div
            className="history-situations"
            aria-label="Tình huống mô phỏng trong khoảng đang chọn"
          >
            <span>Khám phá diễn biến</span>
            {situations.map((event) => (
              <button
                key={`${event.assetId}-${event.kind}`}
                onClick={() => {
                  setState({
                    ...state,
                    day: event.date,
                    assetId: event.assetId,
                  });
                  setFocusRequest((n) => n + 1);
                }}
              >
                <strong>{event.assetId}</strong>{" "}
                {event.label.includes("Bụi")
                  ? "Bám bụi"
                  : event.label.includes("nhiệt")
                    ? "Giới hạn nhiệt"
                    : event.kind === "branch-derating"
                      ? "Giảm công suất nhánh"
                      : event.kind === "inverter-stop"
                        ? "Dừng inverter"
                        : event.kind === "data-gap"
                          ? "Thiếu dữ liệu"
                          : event.label.split(":")[0]}{" "}
                <small>{dayLabel(event.date)}</small>
              </button>
            ))}
            {!situations.length && (
              <span>Các cụm hoạt động ổn định trong khoảng này.</span>
            )}
          </div>
          <div className="history-scene-wrap">
            {active && (
              <PlantScene
                assets={assets}
                selected={assetId}
                onSelect={(id) => {
                  if (id.startsWith("PV-")) chooseAsset(id);
                }}
                focusRequest={focusRequest}
                reset={reset}
                scenario={null}
                target=""
                severity={0}
                heatmap={heatmap}
              />
            )}
          </div>
          <div className="history-heatmap-legend" aria-label="Chú giải heatmap">
            <strong>
              {metric === "energy" ? "Sản lượng AC của cụm" : "Mức đạt kỳ vọng"}
            </strong>
            <div className={`history-color-ramp ${metric}`} />
            <div className={`history-color-ticks ${metric}`}>
              {metric === "energy" ? (
                <>
                  <span>0</span>
                  <span>{HISTORY_DAILY_ENERGY_MAX * scopeDays} MWh</span>
                </>
              ) : (
                performanceStops
                  .filter((s) => s.value !== 95)
                  .map((s) => (
                    <span
                      key={s.value}
                      style={{
                        left: `${s.value}%`,
                        transform:
                          s.value === 100
                            ? "translateX(-100%)"
                            : s.value === 0
                              ? undefined
                              : "translateX(-50%)",
                      }}
                    >
                      {s.value}
                      {s.value === 100 ? "+" : ""}%
                    </span>
                  ))
              )}
            </div>
            <p>
              <i className="history-missing-key" /> Xám: không có dữ liệu{" "}
              <span>· Viền nâu: dữ liệu một phần</span>
            </p>
            <p>
              {metric === "energy"
                ? "Thang cố định 45 MWh/cụm/ngày × số ngày đang xem."
                : "Thang màu cố định giữa các ngày; màu thể hiện tỷ lệ, chưa phải cảnh báo tự động."}
            </p>
          </div>
          <p className="history-scene-help">
            Kéo để xoay · Cuộn hoặc chụm hai ngón để zoom · Chọn cụm để xem chi
            tiết
          </p>
        </section>
        <details
          className="history-panel history-detail"
          open={Boolean(assetId)}
        >
          <summary>
            {assetId
              ? `Chi tiết ${assetId}`
              : "Xem chi tiết và chất lượng dữ liệu"}
          </summary>
          <span className="history-eyebrow">PHẠM VI PHÂN TÍCH</span>
          <h2 id="history-detail-title">
            {assetId ? `Chi tiết ${assetId}` : "Tổng quan nhà máy"}
          </h2>

          <p className="history-muted">
            {rangeLabel(scope)}
            {row
              ? ` · ${row.inverterId} · ${row.nominalDCMWp} MWp DC`
              : " · 50 MWp DC / 40 MW AC"}
          </p>
          <dl>
            <div>
              <dt>Ghi nhận AC</dt>
              <dd>{format(summary.actualEnergyMWh)} MWh</dd>
            </div>
            <div>
              <dt>Kỳ vọng cùng phần dữ liệu</dt>
              <dd>{format(summary.matchedExpectedEnergyMWh)} MWh</dd>
            </div>
            <div>
              <dt>Chênh lệch so kỳ vọng</dt>
              <dd>{format(summary.shortfallMWh)} MWh</dd>
            </div>
            <div>
              <dt>Đạt kỳ vọng</dt>
              <dd>{format(summary.performancePct)}%</dd>
            </div>
          </dl>
          {summary.quality !== "complete" && (
            <p className="history-data-note">
              Dữ liệu chưa đầy đủ. Tỷ lệ và chênh lệch chỉ tính trên các khoảng
              có số liệu; không ước lượng phần thiếu.
            </p>
          )}
          <p className="history-muted">
            Sản lượng AC theo inverter tương ứng, hiển thị trên cụm pin. Không
            phải số đo riêng từng tấm pin.
          </p>
          {assetId && (
            <div className="history-events">
              <h3>Diễn biến mô phỏng</h3>
              {events.length ? (
                <ul>
                  {events.slice(0, 6).map((event, i) => (
                    <li key={`${event.date}-${i}`}>
                      <time>{dayLabel(event.date)}</time>
                      {event.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Không có tình huống vận hành được dựng trong thời đoạn này.
                </p>
              )}
              {events.length > 6 && (
                <p>
                  Còn {events.length - 6} diễn biến; chọn một ngày để xem rõ
                  hơn.
                </p>
              )}
            </div>
          )}
        </details>
      </div>

      <div className="history-analysis-grid">
        <section
          className="history-panel history-trend"
          aria-labelledby="history-trend-title"
        >
          <div className="history-section-title">
            <div>
              <span className="history-eyebrow">DIỄN BIẾN THEO NGÀY</span>
              <h2 id="history-trend-title">Sản lượng và kỳ vọng</h2>
            </div>
            <span className="history-muted">{assetId ?? "Toàn nhà máy"}</span>
          </div>
          <div className="history-chart-legend">
            <span>
              <i />
              Ghi nhận
            </span>
            <span>
              <i />
              Kỳ vọng toàn ngày
            </span>
            <span>Điểm rỗng: dữ liệu chưa đủ</span>
          </div>
          <HistoryChart
            rows={chart.byDay}
            selected={day}
            onSelect={chooseDay}
          />
          <p className="history-muted">
            Chọn điểm trên biểu đồ để xem ngày tương ứng. Đường ghi nhận bị ngắt
            khi không có dữ liệu.
          </p>
        </section>
        <details className="history-compare-disclosure history-panel">
          <summary>So sánh với kỳ khác</summary>
          <HistoryComparison data={data} scope={scope} assetId={assetId} />
        </details>
      </div>

      <section
        id="history-assets"
        className="history-panel history-assets"
        aria-label="Dữ liệu các cụm pin"
      >
        <div className="history-section-title">
          <div>
            <span className="history-eyebrow">CHI TIẾT THEO KHU VỰC</span>
            <h2>Các cụm pin</h2>
          </div>
          <button aria-expanded={showAssets} onClick={onToggleAssets}>
            <Layers3 size={16} />
            {showAssets ? "Thu gọn" : "Mở bảng dữ liệu"}
          </button>
        </div>
        {showAssets && (
          <div className="history-table-scroll">
            <table>
              <caption>
                {rangeLabel(scope)} · Chọn ID cụm để xem chi tiết
              </caption>
              <thead>
                <tr>
                  <th>Cụm pin</th>
                  <th>Ghi nhận (MWh)</th>
                  <th>Kỳ vọng (MWh)</th>
                  <th>Đạt kỳ vọng</th>
                  <th>Độ phủ</th>
                  <th>Dữ liệu</th>
                </tr>
              </thead>
              <tbody>
                {allScope.byAsset.map((r) => (
                  <tr key={r.assetId} aria-selected={assetId === r.assetId}>
                    <th scope="row">
                      <button
                        aria-pressed={assetId === r.assetId}
                        onClick={() =>
                          chooseAsset(assetId === r.assetId ? null : r.assetId)
                        }
                      >
                        <i style={{ background: heatmap[r.assetId].color }} />
                        {r.assetId}
                        <small>{r.area}</small>
                      </button>
                    </th>
                    <td>{format(r.actualEnergyMWh)}</td>
                    <td>{format(r.expectedEnergyMWh)}</td>
                    <td>{format(r.performancePct)}%</td>
                    <td>{format(r.coveragePct, 1)}%</td>
                    <td>
                      <span className={`history-quality ${r.quality}`}>
                        {qualityLabel(r)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
