"use client";
import type { EnergySummary } from "@/lib/performance-history";

export function HistoryChart({
  rows,
  selected,
  onSelect,
}: {
  rows: (EnergySummary & { date: string })[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const width = 760,
    height = 230,
    left = 52,
    bottom = 194;
  const max =
    Math.max(
      1,
      ...rows.map((r) => Math.max(r.expectedEnergyMWh, r.actualEnergyMWh ?? 0)),
    ) * 1.12;
  const x = (i: number) =>
    left + (i + 0.5) * ((width - left - 16) / rows.length);
  const y = (n: number) => bottom - (n / max) * (bottom - 18);
  const path = (key: "actualEnergyMWh" | "expectedEnergyMWh") => {
    let previous = false;
    return rows
      .map((row, i) => {
        const value = row[key];
        if (value === null) {
          previous = false;
          return "";
        }
        const segment = `${previous ? "L" : "M"}${x(i)},${y(value)}`;
        previous = true;
        return segment;
      })
      .join(" ");
  };
  const text = (n: number | null) =>
    n === null
      ? "không có dữ liệu"
      : `${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} MWh`;
  return (
    <svg
      className="history-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label="Diễn biến sản lượng theo ngày"
    >
      <text x="8" y="12" className="chart-unit">
        MWh
      </text>
      {[0, 1, 2, 3, 4].map((tick) => {
        const value = (max * tick) / 4;
        return (
          <g key={tick}>
            <line
              x1={left}
              x2={width - 10}
              y1={y(value)}
              y2={y(value)}
              className="history-grid-line"
            />
            <text x={left - 9} y={y(value) + 4} textAnchor="end">
              {Math.round(value)}
            </text>
          </g>
        );
      })}
      <path d={path("expectedEnergyMWh")} className="history-expected-line" />
      <path d={path("actualEnergyMWh")} className="history-actual-line" />
      {rows.map((row, i) => (
        <g
          key={row.date}
          role="button"
          tabIndex={0}
          aria-label={`Xem ngày ${row.date}: ${text(row.actualEnergyMWh)}${row.quality !== "complete" ? ", dữ liệu chưa đầy đủ" : ""}`}
          aria-pressed={selected === row.date}
          onClick={() => onSelect(row.date)}
          onKeyDown={(e) => {
            if (["Enter", " "].includes(e.key)) {
              e.preventDefault();
              onSelect(row.date);
            }
          }}
        >
          <title>{`${row.date} · Ghi nhận ${text(row.actualEnergyMWh)} · Kỳ vọng ${text(row.expectedEnergyMWh)} · Độ phủ ${row.coveragePct?.toFixed(1) ?? "—"}%`}</title>
          {selected === row.date && (
            <line
              x1={x(i)}
              x2={x(i)}
              y1="15"
              y2={bottom}
              className="history-cursor"
            />
          )}
          <rect
            x={x(i) - 9}
            y="15"
            width="18"
            height={bottom - 15}
            fill="transparent"
          />
          <circle
            cx={x(i)}
            cy={y(row.expectedEnergyMWh)}
            r="3"
            fill="white"
            stroke="#94a9be"
            strokeWidth="1.5"
          />
          <circle
            cx={x(i)}
            cy={y(row.actualEnergyMWh ?? 0)}
            r={selected === row.date ? 6 : 4}
            className={
              row.quality === "complete"
                ? "history-point"
                : "history-point-partial"
            }
          />
          {(rows.length <= 8 ||
            i % Math.ceil(rows.length / 8) === 0 ||
            i === rows.length - 1) && (
            <text x={x(i)} y={bottom + 22} textAnchor="middle">
              {row.date.slice(8)}/{row.date.slice(5, 7)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
