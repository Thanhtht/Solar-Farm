"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useId, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Focus, Layers3 } from "lucide-react";
import { getHongLiemBlock } from "@/data/hong-liem-blocks";
import { usePlant } from "./plant-context";
import { getHistoryBranches } from "@/data/history-model";
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
import { HistoryAssistant } from "./history-assistant";
import { HistoryChart } from "./history-chart";
import { HistoryRegionCharts } from "./history-region-charts";
import { HistoryComparisonChart } from "./history-comparison-chart";

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
function useComparisonScopes() {
  const { plantId } = usePlant();
  const historyBranches = getHistoryBranches(plantId);
  const comparisonScopes = [
    { value: "plant", label: "Toàn nhà máy" },
    ...Array.from(new Set(historyBranches.map((b) => b.area))).map((area) => ({
      value: `area:${area}`,
      label: area,
    })),
    ...historyBranches.map((b) => ({
      value: b.assetId,
      label: `${b.assetId} · ${b.area}`,
    })),
  ];
  const scopeName = (key: string) =>
    comparisonScopes.find((s) => s.value === key)?.label ?? key;
  return { comparisonScopes, scopeName };
}
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
  const id = useId();
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

function HistoryComparison({ data }: { data: PerformanceHistory }) {
  const { comparisonScopes, scopeName } = useComparisonScopes();
  const [scopeA, setScopeA] = useState("plant");
  const [scopeB, setScopeB] = useState("plant");
  const [primary, setPrimary] = useState<DateRange>(() =>
    historyPreset("7d", data.window),
  );
  const [comparison, setComparison] = useState<DateRange>(() =>
    previousPeriod(historyPreset("7d", data.window)),
  );
  const result = (() => {
    try {
      return compareHistory(data, primary, comparison, scopeA, scopeB);
    } catch {
      return {
        available: false as const,
        reason:
          "Khoảng đã chọn nằm ngoài cửa sổ dữ liệu hiện có. Hãy chọn lại hai kỳ.",
      };
    }
  })();
  const periods = result.available
    ? [
        {
          label: "Kỳ A",
          scopeLabel: scopeName(scopeA),
          range: primary,
          days: result.primaryDays,
          summary: result.primary.summary,
          mean: result.primaryDailyMWh,
        },
        {
          label: "Kỳ B",
          scopeLabel: scopeName(scopeB),
          range: comparison,
          days: result.comparisonDays,
          summary: result.comparison.summary,
          mean: result.comparisonDailyMWh,
        },
      ]
    : [];
  const rows = result.available
    ? [
        {
          label: "Thực tế (MWh)",
          values: periods.map((p) => p.summary.actualEnergyMWh),
        },
        {
          label: "Kỳ vọng (MWh)",
          values: periods.map((p) => p.summary.expectedEnergyMWh),
        },
        { label: "Thực tế/ngày (MWh)", values: periods.map((p) => p.mean) },
        {
          label: "Kỳ vọng/ngày (MWh)",
          values: periods.map((p) => p.summary.expectedEnergyMWh / p.days),
        },
        {
          label: "Hiệu suất (%)",
          values: periods.map((p) => p.summary.performancePct),
        },
        {
          label: "Độ phủ (%)",
          values: periods.map((p) => p.summary.coveragePct),
        },
      ]
    : [];
  return (
    <section
      className="history-comparison history-panel"
      aria-labelledby="history-compare-title"
    >
      <div className="history-section-title">
        <div>
          <span className="history-eyebrow">HAI KỲ ĐỘC LẬP</span>
          <h2 id="history-compare-title">So sánh thời gian</h2>
        </div>
      </div>
      <div className="history-comparison-ranges">
        <div>
          <h3>Kỳ A</h3>
          <label className="history-comparison-scope">
            Khu vực
            <select
              aria-label="Khu vực kỳ A"
              value={scopeA}
              onChange={(e) => setScopeA(e.target.value)}
            >
              {comparisonScopes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <RangeForm
            label="Kỳ A"
            value={primary}
            min={data.window.start}
            max={data.window.end}
            onApply={setPrimary}
          />
        </div>
        <div>
          <h3>Kỳ B</h3>
          <label className="history-comparison-scope">
            Khu vực
            <select
              aria-label="Khu vực kỳ B"
              value={scopeB}
              onChange={(e) => setScopeB(e.target.value)}
            >
              {comparisonScopes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <RangeForm
            label="Kỳ B"
            value={comparison}
            min={data.window.start}
            max={data.window.end}
            onApply={setComparison}
          />
        </div>
      </div>
      <p className="history-muted">
        Chọn tự do hai khoảng trong lịch sử hiện có. Thời gian ở phần trên không
        thay đổi hai kỳ này. Kỳ vọng tính theo thời tiết.
      </p>
      {!result.available ? (
        <p className="history-empty" role="status">
          {result.reason}
        </p>
      ) : (
        <>
          <div className="history-compare-layout">
            <div className="history-compare-numbers">
              <table aria-label="Số liệu so sánh hai kỳ">
                <thead>
                  <tr>
                    <th>Chỉ số</th>
                    {periods.map((p) => (
                      <th key={p.label}>
                        {p.label}
                        <small>
                          {p.scopeLabel}
                          <br />
                          {rangeLabel(p.range)}
                          <br />
                          {p.days} ngày
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {row.values.map((value, i) => (
                        <td key={i}>{format(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  Hiệu suất{" "}
                  <strong>
                    {result.performanceChangePoints === null
                      ? "—"
                      : `${result.performanceChangePoints >= 0 ? "+" : ""}${format(result.performanceChangePoints)} điểm %`}
                  </strong>
                </span>
              </div>
            </div>
            <div className="history-period-charts">
              <HistoryComparisonChart periods={periods} />
              <HistoryComparisonChart periods={periods} metric="performance" />
            </div>
          </div>
          {result.primaryDays !== result.comparisonDays && (
            <p className="history-muted">
              Hai kỳ khác số ngày; chart dùng sản lượng bình quân/ngày để đối
              chiếu.
            </p>
          )}
          {(result.primary.summary.quality !== "complete" ||
            result.comparison.summary.quality !== "complete") && (
            <p className="history-muted">
              Có dữ liệu chưa đầy đủ. Sản lượng chỉ là phần ghi nhận; không tính
              % thay đổi sản lượng. Hiệu suất dùng cùng phần dữ liệu hợp lệ.
            </p>
          )}
          <p className="history-muted">
            Thời tiết giữa hai kỳ có thể khác nhau. Chênh lệch không tự xác định
            nguyên nhân suy giảm thiết bị.
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
  const { assets, plantId } = usePlant();
  const historyBranches = getHistoryBranches(plantId);
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
        const data = createPerformanceHistory({ now, plantId });
        const preset = previous?.preset ?? "all";
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
              : previous
                ? null
                : window.end,
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
  }, [active, plantId]);

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
    setState((s) =>
      s
        ? {
            ...s,
            day: date,
            range: historyPreset("all", s.data.window),
            preset: "all",
          }
        : s,
    );
  const chooseAsset = (id: string | null) => {
    setState((s) => (s ? { ...s, assetId: id } : s));
    setFocusRequest((n) => n + 1);
  };
  const chooseRange = (range: DateRange, preset: ViewState["preset"]) =>
    setState((s) => (s ? { ...s, range, preset, day: null } : s));
  const situations = [
    ...new Map(
      data.days
        .filter(
          (d) =>
            d.date >= scope.start &&
            d.date <= scope.end &&
            (!assetId ||
              d.assetId === (getHongLiemBlock(assetId)?.parentId ?? assetId)),
        )
        .flatMap((d) =>
          d.events.map((event) => ({
            ...event,
            date: d.date,
            assetId: d.assetId,
          })),
        )
        .map(
          (event) =>
            [`${event.date}:${event.assetId}:${event.kind}`, event] as const,
        ),
    ).values(),
  ].sort((a, b) => {
    const rank = (kind: string) =>
      kind === "inverter-stop" ? 0 : kind === "data-gap" ? 1 : 2;
    return rank(a.kind) - rank(b.kind);
  });
  return (
    <div
      className="history-dashboard history-compact"
      data-testid="history-dashboard"
      data-today={data.window.today}
      data-scope-start={scope.start}
      data-scope-end={scope.end}
      data-selected-asset={assetId ?? "plant"}
    >
      {selectedScope.dataScope && (
        <p className="history-muted">
          {assetId} · {selectedScope.dataScope}
        </p>
      )}
      <div className="history-scene-grid">
        <section
          className="history-panel history-scene-panel"
          aria-label="Bản đồ hiệu suất 3D"
        >
          <section
            className="history-toolbar history-panel"
            aria-label="Thời gian thống kê"
          >
            <div className="statistics-filter-row">
              <label className="statistics-scope-select">
                Phạm vi
                <select
                  aria-label="Chọn cụm pin lịch sử"
                  value={assetId ?? ""}
                  onChange={(e) => chooseAsset(e.target.value || null)}
                >
                  <option value="">Toàn nhà máy</option>
                  {getHongLiemBlock(assetId) && (
                    <option value={assetId!}>{assetId} · cụm pin nhỏ</option>
                  )}
                  {historyBranches.map((b) => (
                    <option key={b.assetId} value={b.assetId}>
                      {b.assetId} · {b.area}
                    </option>
                  ))}
                </select>
              </label>
              <label className="statistics-mode-select">
                Xem theo
                <select
                  aria-label="Chế độ thời gian thống kê"
                  value={day ? "day" : "range"}
                  onChange={(e) =>
                    setState(
                      e.target.value === "day"
                        ? {
                            ...state,
                            range: historyPreset("all", data.window),
                            preset: "all",
                            day: data.window.end,
                          }
                        : { ...state, day: null },
                    )
                  }
                >
                  <option value="day">Theo ngày</option>
                  <option value="range">Khoảng thời gian</option>
                </select>
              </label>
              <div className="statistics-time-controls">
                {day && (
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
                    </div>
                    <div className="history-slider-row">
                      <button
                        aria-label="Ngày trước"
                        disabled={Boolean(day) && index === 0}
                        onClick={() =>
                          chooseDay(
                            dates[
                              day ? Math.max(0, index - 1) : dates.length - 1
                            ],
                          )
                        }
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="statistics-first-date">
                        {dayLabel(data.window.start)}
                      </span>
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
                        onChange={(e) =>
                          chooseDay(dates[Number(e.target.value)])
                        }
                        onKeyDown={(e) => {
                          if (!day && e.key === "Home") chooseDay(dates[0]);
                        }}
                      />
                      <span className="statistics-last-date">
                        {dayLabel(data.window.end)}
                      </span>
                      <button
                        aria-label="Ngày sau"
                        disabled={Boolean(day) && index === dates.length - 1}
                        onClick={() =>
                          chooseDay(
                            dates[
                              day ? Math.min(dates.length - 1, index + 1) : 0
                            ],
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
                )}
                {!day && (
                  <div className="statistics-range-controls">
                    <details className="statistics-range-picker">
                      <summary aria-label="Khoảng thời gian đang chọn">
                        {dayLabel(range.start)} – {dayLabel(range.end)}
                      </summary>
                      <RangeForm
                        label="Khoảng phân tích"
                        value={range}
                        min={data.window.start}
                        max={data.window.end}
                        onApply={(r) => {
                          chooseRange(r, "custom");
                          document
                            .querySelector(".statistics-range-picker")
                            ?.removeAttribute("open");
                        }}
                      />
                    </details>
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <div className="history-overview">
            <section
              className="history-kpis"
              aria-label="Chỉ số hiệu suất lịch sử"
            >
              {[
                {
                  id: "energy",
                  color: "#2478c4",
                  title:
                    summary.quality === "complete"
                      ? "Sản lượng thực tế"
                      : "Sản lượng thực tế (một phần)",
                  value: summary.actualEnergyMWh,
                  unit: "MWh AC",
                  note: "Tổng phần có số liệu hợp lệ",
                },
                {
                  id: "expected",
                  color: "#c34336",
                  title: "Thiếu hụt",
                  value: summary.shortfallMWh,
                  unit: "MWh AC",
                  note: "So với sản lượng kỳ vọng theo bức xạ và nhiệt độ của từng ngày, chỉ tính trên phần dữ liệu hợp lệ",
                },
                {
                  id: "performance",
                  color: heatmapColor(
                    summary.performancePct,
                    "performance",
                    scopeDays,
                  ),
                  title: "Hiệu suất",
                  value: summary.performancePct,
                  unit: "%",
                  note: `Cùng phần dữ liệu · ${format(summary.matchedExpectedEnergyMWh)} MWh kỳ vọng`,
                },
              ].map((kpi) => (
                <article
                  key={kpi.id}
                  className="history-kpi"
                  style={{ "--kpi-color": kpi.color } as CSSProperties}
                  title={kpi.note}
                  aria-label={`${kpi.title}: ${format(kpi.value)} ${kpi.unit}. ${kpi.note}`}
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
            <section className="history-case-disclosure">
              <h3>
                Sự kiện cần chú ý <small>({situations.length})</small>
              </h3>{" "}
              <div
                className="history-situations"
                aria-label="Tình huống mô phỏng trong khoảng đang chọn"
              >
                <span>Sự kiện cần chú ý</span>
                {situations.map((event) => (
                  <button
                    key={`${event.date}-${event.assetId}-${event.kind}`}
                    onClick={() => {
                      setState({
                        ...state,
                        day: event.date,
                        range: historyPreset("all", data.window),
                        preset: "all",
                        assetId: event.assetId,
                      });
                      setFocusRequest((n) => n + 1);
                    }}
                  >
                    <strong>{event.assetId}</strong> {event.label}{" "}
                    <small>{dayLabel(event.date)}</small>
                  </button>
                ))}
                {!situations.length && (
                  <span>
                    Không có sự kiện mô phỏng trong thời gian đang xem.
                  </span>
                )}
              </div>
            </section>
          </div>
          <div className="history-scene-wrap">
            {" "}
            <div className="history-scene-top">
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
                Hiệu suất · %
              </button>
            </div>
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
            <div
              className="history-heatmap-legend"
              aria-label="Chú giải heatmap"
            >
              <strong>
                {metric === "energy" ? "Sản lượng" : "Hiệu suất"}
                {metric === "energy" && <small>MWh AC</small>}
              </strong>
              <div className={`history-color-ramp ${metric}`} />
              <div className={`history-color-ticks ${metric}`}>
                {metric === "energy" ? (
                  <>
                    <span>0</span>
                    <span>
                      {format(HISTORY_DAILY_ENERGY_MAX * scopeDays, 0)}
                    </span>
                  </>
                ) : (
                  performanceStops
                    .filter((s) => s.value !== 95)
                    .map((s) => (
                      <span
                        key={s.value}
                        style={{
                          top: `${100 - s.value}%`,
                          transform:
                            s.value === 0
                              ? "translateY(-100%)"
                              : s.value === 100
                                ? undefined
                                : "translateY(-50%)",
                        }}
                      >
                        {s.value}
                        {s.value === 100 ? "+" : ""}%
                      </span>
                    ))
                )}
              </div>
              <details className="history-legend-info">
                <summary aria-label="Giải thích thang màu và chất lượng dữ liệu">
                  i
                </summary>
                <p>
                  <i className="history-missing-key" /> Xám: không có dữ liệu.
                  Viền nâu: dữ liệu một phần.
                  {metric === "energy"
                    ? " Thang 45 MWh/cụm/ngày × số ngày đang xem."
                    : " Thang cố định giữa các ngày; màu không phải cảnh báo tự động."}
                </p>
              </details>
            </div>
          </div>
          <p className="history-scene-help">
            Kéo để xoay · Cuộn hoặc chụm hai ngón để zoom · Chọn cụm để xem chi
            tiết
          </p>
        </section>
        <HistoryAssistant
          active={active}
          window={data.window}
          start={scope.start}
          end={scope.end}
          assetId={assetId}
          summary={summary}
        />
      </div>
      <div className="history-analysis-grid">
        <section
          className="history-panel history-trend"
          aria-labelledby="history-trend-title"
        >
          <div className="history-section-title">
            <div>
              <span className="history-eyebrow">DIỄN BIẾN THEO NGÀY</span>
              <h2 id="history-trend-title">Sản lượng & kỳ vọng</h2>
            </div>
            <span className="history-muted">{assetId ?? "Toàn nhà máy"}</span>
          </div>
          <div className="history-chart-legend">
            <span>
              <i />
              Thực tế
            </span>
            <span>
              <i />
              Kỳ vọng theo thời tiết
            </span>
            <span>Điểm rỗng: dữ liệu chưa đủ</span>
          </div>
          <HistoryChart
            rows={chart.byDay}
            selected={day}
            onSelect={chooseDay}
          />
          <p className="history-muted">
            Kỳ vọng của nhánh khỏe mạnh theo bức xạ và nhiệt độ từng ngày. Vòng
            rỗng: dữ liệu một phần; miền ngắt khi thiếu dữ liệu.
          </p>
        </section>
        <section
          className="history-panel history-performance-trend"
          aria-labelledby="history-performance-title"
        >
          <div className="history-section-title">
            <div>
              <span className="history-eyebrow">TỶ LỆ THEO NGÀY</span>
              <h2 id="history-performance-title">Hiệu suất</h2>
            </div>
            <span className="history-muted">{assetId ?? "Toàn nhà máy"}</span>
          </div>
          <div className="history-chart-legend">
            <span>
              <i className="history-performance-key" />
              Thực tế / kỳ vọng cùng phần dữ liệu
            </span>
          </div>
          <HistoryChart
            rows={chart.byDay}
            selected={day}
            onSelect={chooseDay}
            metric="performance"
          />
          <p className="history-muted">
            100%: đạt kỳ vọng theo thời tiết. Chọn ngày trên một trong hai biểu
            đồ để xem cùng phạm vi.
          </p>
        </section>
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
          <div className="history-assets-layout">
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
                    <th>Hiệu suất</th>
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
                            chooseAsset(
                              assetId === r.assetId ? null : r.assetId,
                            )
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
            <HistoryRegionCharts
              rows={allScope.byAsset}
              selected={assetId}
              onSelect={(id) => chooseAsset(assetId === id ? null : id)}
            />
          </div>
        )}
      </section>
      <details className="history-compare-disclosure history-panel" open>
        <summary>So sánh với kỳ khác</summary>
        <HistoryComparison data={data} />
      </details>
    </div>
  );
}
