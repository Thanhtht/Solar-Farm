"use client";
import { Cloud, Wind, ZapOff } from "lucide-react";
import { getPlantProfile } from "@/data/plant-profiles";
import { scenarios, type ScenarioId } from "@/data/plant";
import {
  referencePower,
  forecast,
  powerAt,
  type Config,
} from "@/lib/scenario-simulation";
import { number } from "./device-profile";
import type { Run } from "@/lib/simulation";
const scenarioIcons = { cloud: Cloud, dust: Wind, fault: ZapOff };
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
  const count = getPlantProfile(config.plantId).assets.filter(
    (a) => a.type === "inverter",
  ).length;
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
        <div className="scenario-picker">
          <span id="scenario-picker-label">Kịch bản</span>
          <div
            role="radiogroup"
            aria-labelledby="scenario-picker-label"
            aria-label="Kịch bản mô phỏng"
          >
            {scenarios.map((s) => {
              const Icon = scenarioIcons[s.id];
              const checked = config.kind === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-scenario={s.id}
                  className="scenario-choice"
                  onClick={() => onScenario(s.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {s.id === "fault" ? "Lỗi inverter" : s.name}
                </button>
              );
            })}
          </div>
        </div>
        <label>
          Quy mô
          <select
            aria-label="Quy mô ảnh hưởng"
            value={config.scale ?? 1}
            onChange={(e) => onChange({ scale: Number(e.target.value) })}
          >
            {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === count ? `Toàn bộ ${count} cụm` : `${n} cụm`}
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
      <div
        className={`setup-metrics${submitted ? " has-result" : ""}`}
        aria-live="polite"
      >
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
