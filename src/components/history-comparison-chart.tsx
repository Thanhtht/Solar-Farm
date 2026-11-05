import { useId } from "react";
import type { EnergySummary } from "@/lib/performance-history";

type Period = { label: string; days: number; summary: EnergySummary };
export function HistoryComparisonChart({ periods }: { periods: Period[] }) {
  const id = useId();
  const width = 480,
    height = 260,
    left = 48,
    right = 20,
    top = 32,
    bottom = 210;
  const maxValue = Math.max(
    1,
    ...periods.flatMap((p) => [
      p.summary.expectedEnergyMWh / p.days,
      (p.summary.actualEnergyMWh ?? 0) / p.days,
    ]),
  );
  const magnitude = 10 ** Math.floor(Math.log10(maxValue / 4));
  const step =
    ([1, 2, 5, 10].find((n) => n * magnitude >= maxValue / 4) ?? 10) *
    magnitude;
  const max = Math.ceil(maxValue / step) * step;
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  const number = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  return (
    <div className="history-comparison-chart">
      <h3>Sản lượng bình quân/ngày</h3>
      <div className="history-chart-legend">
        <span>
          <i />
          Thực tế
        </span>
        <span>
          <i />
          Kỳ vọng theo thời tiết
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="So sánh sản lượng thực tế và kỳ vọng bình quân mỗi ngày của hai kỳ"
      >
        <defs>
          <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#dbeafe" />
            <path d="M0,6 L6,0" stroke="#267bd5" strokeWidth="1.5" />
          </pattern>
        </defs>
        <text x="5" y="14">
          MWh/ngày
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
          const values = [
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
              {values.map((v, j) => (
                <g
                  key={v.key}
                  data-period={p.label}
                  data-metric={v.key}
                  data-value={v.value ?? ""}
                >
                  <title>{`${p.label} · ${v.label}: ${number(v.value)} MWh/ngày${v.key === "actual" && p.summary.quality !== "complete" ? " · Dữ liệu chưa đầy đủ" : ""}`}</title>
                  {v.value !== null && (
                    <rect
                      x={center - 47 + j * 52}
                      y={y(v.value)}
                      width="42"
                      height={bottom - y(v.value)}
                      rx="4"
                      fill={
                        v.key === "actual" && p.summary.quality !== "complete"
                          ? `url(#${id})`
                          : v.color
                      }
                    />
                  )}
                  <text
                    x={center - 26 + j * 52}
                    y={v.value === null ? bottom - 8 : y(v.value) - 8}
                    textAnchor="middle"
                    className="history-bar-value"
                  >
                    {number(v.value)}
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
        Cùng đơn vị MWh/ngày. Cột gạch chéo: thực tế chỉ ghi nhận một phần dữ
        liệu.
      </p>
    </div>
  );
}
