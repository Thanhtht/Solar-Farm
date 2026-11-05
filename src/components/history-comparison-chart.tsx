import { useId } from "react";
import { heatmapColor } from "@/lib/history-presentation";
import type { EnergySummary } from "@/lib/performance-history";

type Period = {
  label: string;
  days: number;
  summary: EnergySummary;
  scopeLabel?: string;
};
export function HistoryComparisonChart({
  periods,
  metric = "energy",
}: {
  periods: Period[];
  metric?: "energy" | "performance";
}) {
  const performance = metric === "performance";
  const id = useId();
  const width = 480,
    height = 260,
    left = 48,
    right = 20,
    top = 32,
    bottom = 210;
  const maxValue = Math.max(
    1,
    ...periods.flatMap((p) =>
      performance
        ? [p.summary.performancePct ?? 0]
        : [
            p.summary.expectedEnergyMWh / p.days,
            (p.summary.actualEnergyMWh ?? 0) / p.days,
          ],
    ),
  );
  const magnitude = 10 ** Math.floor(Math.log10(maxValue / 4));
  const step = performance
    ? 25
    : ([1, 2, 5, 10].find((n) => n * magnitude >= maxValue / 4) ?? 10) *
      magnitude;
  const max = Math.max(
    performance ? 100 : 0,
    Math.ceil(maxValue / step) * step,
  );
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  const number = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  return (
    <div className={`history-comparison-chart ${metric}`}>
      <h3>{performance ? "Hiệu suất" : "Sản lượng bình quân/ngày"}</h3>
      <div className="history-chart-legend">
        <span>
          <i style={performance ? { background: "#109b87" } : undefined} />
          {performance ? "Thực tế / kỳ vọng cùng phần dữ liệu" : "Thực tế"}
        </span>
        {!performance && (
          <span>
            <i />
            Kỳ vọng theo thời tiết
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          performance
            ? "So sánh hiệu suất của hai kỳ và khu vực"
            : "So sánh sản lượng thực tế và kỳ vọng bình quân mỗi ngày của hai kỳ"
        }
      >
        <defs>
          {periods.flatMap((p, i) =>
            (performance
              ? [
                  {
                    key: "performance",
                    top: heatmapColor(
                      p.summary.performancePct,
                      "performance",
                      1,
                    ),
                    bottom: heatmapColor(
                      p.summary.performancePct,
                      "performance",
                      1,
                    ),
                  },
                ]
              : [
                  { key: "actual", top: "#57aafa", bottom: "#246fd1" },
                  { key: "expected", top: "#c7d7e7", bottom: "#8fa8c1" },
                ]
            ).map((s) => (
              <linearGradient
                key={`${i}-${s.key}`}
                id={`${id}-${i}-${s.key}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={s.top}
                  stopOpacity={performance ? 0.72 : 1}
                />
                <stop offset="100%" stopColor={s.bottom} />
              </linearGradient>
            )),
          )}
          <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#dbeafe" />
            <path d="M0,6 L6,0" stroke="#267bd5" strokeWidth="1.5" />
          </pattern>
        </defs>
        <text x="5" y="14">
          {performance ? "%" : "MWh/ngày"}
        </text>
        {Array.from(
          { length: Math.round(max / step) + 1 },
          (_, i) => i * step,
        ).map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={width - right}
              y1={y(v)}
              y2={y(v)}
              className="history-grid-line"
            />
            <text x={left - 8} y={y(v) + 4} textAnchor="end">
              {number(v)}
            </text>
          </g>
        ))}
        {periods.map((p, i) => {
          const center =
            left + ((i + 0.5) * (width - left - right)) / periods.length;
          const values = performance
            ? [
                {
                  key: "performance",
                  value: p.summary.performancePct,
                  color: heatmapColor(
                    p.summary.performancePct,
                    "performance",
                    1,
                  ),
                  label: "Hiệu suất",
                },
              ]
            : [
                {
                  key: "actual",
                  value:
                    p.summary.actualEnergyMWh === null
                      ? null
                      : p.summary.actualEnergyMWh / p.days,
                  color: "#267bd5",
                  label: "Thực tế",
                },
                {
                  key: "expected",
                  value: p.summary.expectedEnergyMWh / p.days,
                  color: "#96abc1",
                  label: "Kỳ vọng theo thời tiết",
                },
              ];
          return (
            <g key={p.label}>
              <rect
                className="history-period-backdrop"
                x={center - 76}
                y={top}
                width="152"
                height={bottom - top}
                rx="12"
                aria-hidden="true"
              />
              {values.map((v, j) => (
                <g
                  key={v.key}
                  data-period={p.label}
                  data-metric={v.key}
                  data-value={v.value ?? ""}
                >
                  <title>{`${p.label} · ${p.scopeLabel ?? ""} · ${v.label}: ${number(v.value)} ${performance ? "%" : "MWh/ngày"}${p.summary.quality !== "complete" ? " · Dữ liệu chưa đầy đủ" : ""}`}</title>
                  {v.value !== null && (
                    <rect
                      x={performance ? center - 27 : center - 54 + j * 60}
                      y={y(v.value)}
                      width={performance ? 54 : 48}
                      height={bottom - y(v.value)}
                      rx="6"
                      className="history-comparison-bar"
                      fill={
                        v.key === "actual" && p.summary.quality !== "complete"
                          ? `url(#${id})`
                          : `url(#${id}-${i}-${v.key})`
                      }
                    />
                  )}
                  <text
                    x={performance ? center : center - 30 + j * 60}
                    y={v.value === null ? bottom - 8 : y(v.value) - 8}
                    textAnchor="middle"
                    className="history-bar-value"
                  >
                    {number(v.value)}
                    {performance && v.value !== null ? "%" : ""}
                  </text>
                </g>
              ))}
              <text
                x={center}
                y={bottom + 28}
                textAnchor="middle"
                className="history-period-label"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="history-muted">
        {performance
          ? "Tỷ lệ trên cùng phần dữ liệu hợp lệ; 100% là đạt kỳ vọng."
          : "Cùng đơn vị MWh/ngày. Cột gạch chéo: thực tế chỉ ghi nhận một phần dữ liệu."}
      </p>
    </div>
  );
}
