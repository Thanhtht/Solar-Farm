"use client";
import { heatmapColor } from "@/lib/history-presentation";
import type { EnergySummary } from "@/lib/performance-history";

type Row = EnergySummary & { assetId: string; area: string };
export function HistoryRegionCharts({
  rows,
  selected,
  onSelect,
}: {
  rows: Row[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const number = (n: number | null) =>
    n === null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  const maxEnergy = Math.max(
    1,
    ...rows.map((r) => Math.max(r.expectedEnergyMWh, r.actualEnergyMWh ?? 0)),
  );
  return (
    <div className="history-region-charts">
      {(["energy", "performance"] as const).map((metric) => (
        <section key={metric} className="history-region-chart">
          <h3>
            {metric === "energy" ? "Sản lượng · MWh AC" : "Hiệu suất · %"}
          </h3>
          <p className="history-muted">
            {metric === "energy"
              ? "Xanh: thực tế · nền xám: kỳ vọng"
              : "Màu theo thang hiệu suất 3D"}
          </p>
          <svg
            viewBox={`0 0 340 ${rows.length * 36 + 16}`}
            role="group"
            aria-label={
              metric === "energy"
                ? "So sánh sản lượng giữa các cụm pin"
                : "So sánh hiệu suất giữa các cụm pin"
            }
          >
            {rows.map((r, i) => {
              const value =
                metric === "energy" ? r.actualEnergyMWh : r.performancePct;
              const barWidth =
                value === null
                  ? 0
                  : Math.min(
                      1,
                      Math.max(
                        0,
                        value / (metric === "energy" ? maxEnergy : 100),
                      ),
                    ) * 206;
              return (
                <g
                  key={r.assetId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn ${r.assetId}: ${number(value)} ${metric === "energy" ? "MWh" : "%"}${r.quality === "complete" ? "" : ", dữ liệu chưa đầy đủ"}`}
                  aria-pressed={selected === r.assetId}
                  data-asset={r.assetId}
                  data-value={value ?? ""}
                  onClick={() => onSelect(r.assetId)}
                  onKeyDown={(e) => {
                    if (["Enter", " "].includes(e.key)) {
                      e.preventDefault();
                      onSelect(r.assetId);
                    }
                  }}
                >
                  <title>{`${r.assetId} · ${r.area} · Thực tế ${number(r.actualEnergyMWh)} MWh · Kỳ vọng ${number(r.expectedEnergyMWh)} MWh · Hiệu suất ${number(r.performancePct)}%`}</title>
                  <rect
                    className="history-region-hit"
                    x="0"
                    y={i * 36 + 2}
                    width="340"
                    height="32"
                    rx="5"
                    fill={selected === r.assetId ? "#eaf3fd" : "transparent"}
                  />
                  <text x="4" y={i * 36 + 23}>
                    {r.assetId}
                  </text>
                  <rect
                    x="56"
                    y={i * 36 + 13}
                    width={
                      metric === "energy"
                        ? (r.expectedEnergyMWh / maxEnergy) * 206
                        : 206
                    }
                    height="12"
                    rx="3"
                    fill="#e4ebf2"
                  />
                  {value !== null && (
                    <rect
                      className="history-region-value"
                      x="56"
                      y={i * 36 + 15}
                      width={barWidth}
                      height="8"
                      rx="3"
                      fill={
                        metric === "energy"
                          ? "#267bd5"
                          : heatmapColor(value, "performance", 1)
                      }
                      opacity={r.quality === "complete" ? 1 : 0.6}
                    />
                  )}
                  <text
                    x="334"
                    y={i * 36 + 23}
                    textAnchor="end"
                    className="history-region-number"
                  >
                    {number(value)}
                    {metric === "performance" && value !== null ? "%" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="history-muted">
            {metric === "energy"
              ? "Thanh thực tế nhạt: dữ liệu một phần."
              : "Thiếu dữ liệu: — · Thanh đầy: 100% trở lên."}
          </p>
        </section>
      ))}
    </div>
  );
}
