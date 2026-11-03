"use client";
import { scenarios, type ScenarioId } from "@/data/plant";
import {
  referencePower,
  forecast,
  powerAt,
  type Config,
} from "@/lib/scenario-simulation";
import { number } from "./device-profile";
import type { Run } from "@/lib/simulation";
export const hourOptions = [1, 2, 3, 4, 6, 8, 12, 24];
export function SimulationSetup({
  config,
  submitted,
  onScenario,
  onChange,
  onSubmit,
  onReset,
  initial,
}: {
  config: Config;
  submitted: boolean;
  onScenario: (kind: ScenarioId) => void;
  onChange: (patch: Partial<Config>) => void;
  onSubmit: () => void;
  onReset: () => void;
  initial: Run;
}) {
  const estimate = forecast(config, initial);
  const lostPower = Math.max(
    0,
    referencePower(initial) - powerAt(config, 0, false, initial),
  );
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
              Trạng thái ban đầu
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
        <div className="simulation-actions">
          <button
            className="primary-button"
            disabled={!config.kind}
            onClick={onSubmit}
          >
            Xem kết quả mô phỏng
          </button>
          <button className="simulation-reset" onClick={onReset}>
            Về trạng thái ban đầu
          </button>
        </div>
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
          ? "Tổn thất phát sinh thêm so với trạng thái ban đầu · không cộng lại tổn thất đã xảy ra."
          : `Trạng thái ban đầu: ${number(initial.powerMW!)} MW · giữ các vấn đề có sẵn. Chọn kịch bản rồi bấm xem kết quả.`}
      </p>
    </section>
  );
}
