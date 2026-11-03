"use client";
import { scenarios, type ScenarioId } from "@/data/plant";
import {
  basePower,
  forecast,
  powerAt,
  type Config,
} from "@/lib/scenario-simulation";
import { number } from "./device-profile";
export const hourOptions = [1, 2, 3, 4, 6, 8, 12, 24];
export function SimulationSetup({
  config,
  submitted,
  onScenario,
  onChange,
  onSubmit,
}: {
  config: Config;
  submitted: boolean;
  onScenario: (kind: ScenarioId) => void;
  onChange: (patch: Partial<Config>) => void;
  onSubmit: () => void;
}) {
  const estimate = forecast(config);
  const lostPower = Math.max(0, basePower - powerAt(config, 0));
  return (
    <section
      id="scenarios"
      className="panel simulation-setup"
      aria-label="Thiết lập mô phỏng"
    >
      <div className="simulation-form">
        <label>
          Kịch bản
          <select
            aria-label="Kịch bản mô phỏng"
            value={config.kind ?? ""}
            onChange={(e) => onScenario(e.target.value as ScenarioId)}
          >
            <option value="" disabled>
              Chọn kịch bản
            </option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id === "fault" ? "Hỏng inverter" : s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quy mô
          <select
            aria-label="Quy mô ảnh hưởng"
            value={config.scale ?? 1}
            onChange={(e) => onChange({ scale: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n === 8 ? "Toàn bộ 8 cụm" : `${n} cụm`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Thời gian ảnh hưởng
          <select
            aria-label="Thời gian ảnh hưởng"
            value={config.duration / 60}
            onChange={(e) =>
              onChange({ duration: Number(e.target.value) * 60 })
            }
          >
            {hourOptions.map((h) => (
              <option key={h} value={h}>
                {h} giờ
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary-button"
          disabled={!config.kind}
          onClick={onSubmit}
        >
          Xem kết quả mô phỏng
        </button>
      </div>
      <div className="setup-metrics" aria-live="polite">
        <div>
          <span>Công suất giảm/mất</span>
          <strong data-testid="power-reduction">
            {submitted ? number(lostPower) : "—"} <small>MW</small>
          </strong>
        </div>
        <div>
          <span>
            Tổng sản lượng mất
            {submitted ? ` trong ${config.duration / 60} giờ` : ""}
          </span>
          <strong data-testid="simple-energy-loss">
            {submitted ? number(estimate.lossMWh) : "—"} <small>MWh</small>
          </strong>
        </div>
      </div>
      <p className="setup-note">
        {submitted
          ? "Ước tính với điều kiện nền giữ nguyên · 3D hiển thị vùng chịu ảnh hưởng."
          : "Chọn kịch bản, quy mô và thời gian, sau đó bấm xem kết quả."}
      </p>
    </section>
  );
}
