"use client";
import { useId, useState } from "react";
import type { EnergySummary } from "@/lib/performance-history";

type Row = EnergySummary & { date: string };
type SeriesKey = "actualEnergyMWh" | "expectedEnergyMWh" | "performancePct";

export function HistoryChart({
  rows,
  selected,
  onSelect,
  metric = "energy",
}: {
  rows: Row[];
  selected: string | null;
  onSelect: (date: string) => void;
  metric?: "energy" | "performance";
}) {
  const id = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<string | null>(null);
  const performance = metric === "performance";
  const width = 600,
    height = 260,
    left = 44,
    right = 16,
    top = 24,
    bottom = 220;
  const rawMax = Math.max(
    1,
    ...rows.map((r) =>
      performance
        ? (r.performancePct ?? 0)
        : Math.max(r.expectedEnergyMWh, r.actualEnergyMWh ?? 0),
    ),
  );
  const magnitude = 10 ** Math.floor(Math.log10(rawMax / 4));
  const step = performance
    ? 25
    : ([1, 2, 5, 10].find((n) => n * magnitude >= rawMax / 4) ?? 10) *
      magnitude;
  const max = performance
    ? Math.max(100, Math.ceil(rawMax / step) * step)
    : Math.ceil(rawMax / step) * step;
  const cell = (width - left - right) / Math.max(1, rows.length);
  const x = (i: number) => left + (i + 0.5) * cell;
  const y = (n: number) => bottom - (n / max) * (bottom - top);
  // Each missing value breaks its area and line; it is never drawn as zero.
  const segments = (key: SeriesKey) => {
    const groups: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];
    rows.forEach((row, i) => {
      const value = row[key];
      if (value === null) {
        if (current.length) groups.push(current);
        current = [];
      } else current.push({ x: x(i), y: y(value) });
    });
    if (current.length) groups.push(current);
    return groups;
  };
  const line = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = (points: { x: number; y: number }[]) =>
    points.length === 1
      ? `M${points[0].x - 5},${bottom} L${points[0].x - 5},${points[0].y} L${points[0].x + 5},${points[0].y} L${points[0].x + 5},${bottom} Z`
      : `${line(points)} L${points.at(-1)!.x},${bottom} L${points[0].x},${bottom} Z`;
  const series: { key: SeriesKey; color: string; name: string }[] = performance
    ? [{ key: "performancePct", color: "#109b87", name: "performance" }]
    : [
        { key: "expectedEnergyMWh", color: "#8299b4", name: "expected" },
        { key: "actualEnergyMWh", color: "#267bd5", name: "actual" },
      ];
  const labelIndices = new Set(
    Array.from({ length: Math.min(5, rows.length) }, (_, i) =>
      Math.round(
        (i * (rows.length - 1)) / Math.max(1, Math.min(5, rows.length) - 1),
      ),
    ),
  );
  const text = (n: number | null, unit = performance ? "%" : "MWh") =>
    n === null
      ? "Không có dữ liệu"
      : `${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${unit}`;
  const active = rows.find((r) => r.date === hovered);
  return (
    <div
      className={`history-chart-wrap ${metric}`}
      onMouseLeave={() => setHovered(null)}
    >
      <svg
        className="history-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={
          performance
            ? "Diễn biến hiệu suất theo ngày"
            : "Diễn biến sản lượng theo ngày"
        }
      >
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`${id}-${s.name}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={s.color}
                stopOpacity={s.name === "expected" ? 0.18 : 0.3}
              />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.025" />
            </linearGradient>
          ))}
        </defs>
        <text x="8" y="12" className="chart-unit">
          {performance ? "%" : "MWh AC"}
        </text>
        {Array.from(
          { length: Math.round(max / step) + 1 },
          (_, i) => i * step,
        ).map((value) => (
          <g key={value}>
            <line
              x1={left}
              x2={width - right}
              y1={y(value)}
              y2={y(value)}
              className="history-grid-line"
            />
            <text x={left - 9} y={y(value) + 4} textAnchor="end">
              {value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.key} className={`history-series ${s.name}`}>
            {segments(s.key).map((points, i) => (
              <g key={i}>
                <path
                  d={area(points)}
                  fill={`url(#${id}-${s.name})`}
                  className="history-area"
                />
                <path
                  d={line(points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.name === "expected" ? 1.7 : 2.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        ))}
        {rows.map((row, i) => (
          <g
            key={row.date}
            role="button"
            tabIndex={0}
            aria-pressed={selected === row.date}
            data-highlighted={
              hovered === row.date || selected === row.date || rows.length === 1
            }
            aria-label={`Xem ngày ${row.date}: ${text(performance ? row.performancePct : row.actualEnergyMWh)}${row.quality !== "complete" ? ", dữ liệu chưa đầy đủ" : ""}`}
            onClick={() => onSelect(row.date)}
            onMouseEnter={() => setHovered(row.date)}
            onFocus={() => setHovered(row.date)}
            onBlur={() => setHovered(null)}
            onKeyDown={(e) => {
              if (["Enter", " "].includes(e.key)) {
                e.preventDefault();
                onSelect(row.date);
              }
            }}
          >
            <title>{`${row.date} · ${performance ? `Hiệu suất ${text(row.performancePct)}` : `Thực tế ${text(row.actualEnergyMWh)} · Kỳ vọng theo thời tiết ${text(row.expectedEnergyMWh)}`} · Độ phủ ${row.coveragePct?.toFixed(1) ?? "—"}%`}</title>
            {(selected === row.date || hovered === row.date) && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={top}
                y2={bottom}
                className="history-cursor"
              />
            )}
            <rect
              x={x(i) - cell / 2}
              y={top}
              width={cell}
              height={bottom - top}
              fill="transparent"
            />
            {series.map((s) =>
              row[s.key] === null ? null : (
                <circle
                  key={s.key}
                  cx={x(i)}
                  cy={y(row[s.key]!)}
                  r={selected === row.date || hovered === row.date ? 4 : 2.7}
                  fill={
                    row.quality !== "complete" && s.name !== "expected"
                      ? "white"
                      : s.color
                  }
                  stroke={s.color}
                  strokeWidth="1.6"
                  className={
                    row.quality !== "complete" && s.name !== "expected"
                      ? "history-area-partial"
                      : "history-area-point"
                  }
                />
              ),
            )}
            {labelIndices.has(i) && (
              <text x={x(i)} y={bottom + 24} textAnchor="middle">
                {row.date.slice(8)}/{row.date.slice(5, 7)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {active && (
        <div className="history-chart-tooltip" aria-hidden="true">
          <strong>{active.date.split("-").reverse().join("/")}</strong>
          {performance ? (
            <span>
              Hiệu suất <b>{text(active.performancePct)}</b>
            </span>
          ) : (
            <>
              <span>
                Thực tế <b>{text(active.actualEnergyMWh)}</b>
              </span>
              <span>
                Kỳ vọng theo thời tiết <b>{text(active.expectedEnergyMWh)}</b>
              </span>
            </>
          )}
          {active.quality !== "complete" && <small>Dữ liệu chưa đầy đủ</small>}
        </div>
      )}
    </div>
  );
}
