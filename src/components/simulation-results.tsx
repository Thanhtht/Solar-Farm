"use client";
import { useMemo } from "react";
import {
  forecast,
  basePower,
  powerAt,
  affectedInverters,
  type Session,
  type Config,
} from "@/lib/scenario-simulation";
import { timeLabel } from "@/lib/simulation";
import { Trend, number } from "./device-profile";
export function SimulationResults({
  session,
  layer,
  onLayer,
  onConfig,
  speed,
  onSpeed,
}: {
  session: Session;
  layer: "untreated" | "treated";
  onLayer: (layer: "untreated" | "treated") => void;
  onConfig: (config: Partial<Config>) => void;
  speed: number;
  onSpeed: (speed: number) => void;
}) {
  const estimate = useMemo(() => forecast(session.config), [session.config]);
  const run = session[layer];
  const states = {
    preview: "Xem thử tại phút 0",
    running: "Đang chạy",
    paused: "Tạm dừng",
    complete: "Hoàn thành",
  };
  return (
    <section className="panel chart-panel" aria-label="Kết quả mô phỏng">
      {session.config.kind ? (
        <div
          className="simple-simulation-result"
          aria-label="Kết quả ảnh hưởng"
        >
          <span className="eyebrow">KẾT QUẢ ƯỚC TÍNH · CHƯA XỬ LÝ</span>
          <h2>
            {session.config.kind === "fault"
              ? "Mất công suất do inverter hỏng"
              : "Giảm công suất do " +
                (session.config.kind === "cloud" ? "mây che" : "bám bụi")}
          </h2>
          <div className="impact-summary">
            <p>
              Công suất giảm/mất khi xảy ra
              <strong data-testid="power-reduction">
                {number(Math.max(0, basePower - powerAt(session.config, 0)))} MW{" "}
                <small>
                  (
                  {number(
                    ((basePower - powerAt(session.config, 0)) / basePower) *
                      100,
                  )}
                  % nhà máy)
                </small>
              </strong>
            </p>
            <p>
              Sản lượng mất trong {session.config.duration} phút
              <strong data-testid="simple-energy-loss">
                {number(estimate.lossMWh)} MWh
              </strong>
            </p>
          </div>
          <p>
            {affectedInverters(session.config).length} cụm bị ảnh hưởng · mức
            giảm trên vùng {session.config.severity}%. Cảnh 3D minh họa đúng
            vùng và diễn biến đã thiết lập.
          </p>
          <small>
            Ước tính theo mô hình minh họa, chưa phải số liệu nhà máy thật. Kết
            quả toàn thời đoạn, khác với năng lượng đã tích lũy khi phát lại.
          </small>
        </div>
      ) : (
        <p>Chọn một kịch bản, quy mô và thời gian ảnh hưởng để xem kết quả.</p>
      )}
      <div className="panel-head">
        <h2>Kết quả mô phỏng</h2>
        <strong data-testid="simulation-phase">{states[session.phase]}</strong>
      </div>
      <p data-testid="run-time" data-revision={session.revision}>
        Thời gian mô phỏng · {timeLabel(run.sampledAt)} ICT · phút{" "}
        {session.elapsed}/{session.config.duration}
      </p>
      <details className="simulation-advanced">
        <summary>Xem diễn biến và so sánh phương án (nâng cao)</summary>
        <p className="subtle">
          Đã phát lại: {number(run.energyMWh)} MWh · tổn thất đã tích lũy:{" "}
          {number(run.lossMWh)} MWh · khả dụng: {number(run.availability)}%.
        </p>
        <label>
          Tốc độ phát lại{" "}
          <select
            aria-label="Tốc độ phát lại"
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
          >
            {[1, 5, 15].map((n) => (
              <option key={n} value={n}>
                {n} phút mô phỏng / giây
              </option>
            ))}
          </select>
        </label>
        <div className="simulation-estimates" aria-label="Dự kiến toàn kỳ">
          <p>
            Cơ sở dự kiến: <strong>{number(estimate.baseMWh)} MWh</strong>
          </p>
          <p>
            Chưa xử lý dự kiến:{" "}
            <strong>{number(estimate.untreatedMWh)} MWh</strong>
          </p>
          <p>
            Tổn thất dự kiến toàn kỳ:{" "}
            <strong data-testid="projected-loss">
              {number(estimate.lossMWh)} MWh
            </strong>
          </p>
          {session.config.intervention && (
            <>
              <p>
                Có phương án dự kiến:{" "}
                <strong>{number(estimate.treatedMWh)} MWh</strong>
              </p>
              <p>
                Năng lượng có thể thu hồi:{" "}
                <strong data-testid="recoverable-energy">
                  {number(estimate.recoveredMWh)} MWh
                </strong>
              </p>
            </>
          )}
        </div>
        {session.config.kind === "cloud" ? (
          <p className="subtle">
            Mây phục hồi tự nhiên ở cuối thời đoạn. Chỉ theo dõi, không có
            phương án sửa mây.
          </p>
        ) : (
          session.config.kind && (
            <fieldset className="intervention-controls">
              <legend>So sánh phương án xử lý</legend>
              <label>
                <input
                  type="checkbox"
                  checked={session.config.intervention}
                  onChange={(e) => onConfig({ intervention: e.target.checked })}
                />
                {session.config.kind === "dust"
                  ? "Thử phương án vệ sinh"
                  : "Thử phương án khôi phục inverter"}
              </label>
              {session.config.intervention && (
                <>
                  <label>
                    Hoàn tất tại phút {session.config.interventionMinute}
                    <input
                      aria-label="Thời điểm hoàn tất phương án"
                      type="range"
                      min="0"
                      max={session.config.duration}
                      value={session.config.interventionMinute}
                      onChange={(e) =>
                        onConfig({ interventionMinute: Number(e.target.value) })
                      }
                    />
                  </label>
                  {session.config.kind === "dust" && (
                    <label>
                      Khôi phục phần suy giảm do bụi {session.config.recovery}%
                      <input
                        aria-label="Tỷ lệ khôi phục do vệ sinh"
                        type="range"
                        min="0"
                        max="100"
                        value={session.config.recovery}
                        onChange={(e) =>
                          onConfig({ recovery: Number(e.target.value) })
                        }
                      />
                    </label>
                  )}
                  <div className="segmented">
                    <button
                      aria-pressed={layer === "untreated"}
                      onClick={() => onLayer("untreated")}
                    >
                      Chưa xử lý
                    </button>
                    <button
                      aria-pressed={layer === "treated"}
                      onClick={() => onLayer("treated")}
                    >
                      Có phương án
                    </button>
                  </div>
                  <p className="subtle">
                    Giả định hoàn tất xử lý tại phút đã chọn. Hai đường dùng
                    cùng điều kiện, thời đoạn và bước 60 giây; không phải lệnh
                    vận hành thật hoặc tính ROI.
                  </p>
                </>
              )}
            </fieldset>
          )
        )}
        <p className="subtle">
          {session.phase === "preview"
            ? "Đây là bản xem thử, năng lượng tích lũy bằng 0. Bấm Chạy mô phỏng để phát lại từ đầu."
            : "Biểu đồ chỉ chứa các mẫu đã phát lại."}{" "}
          Đổi tham số tạo lượt xem thử mới; Hiện trạng độc lập.
        </p>
        {[
          { key: "base", label: "Đường cơ sở", color: "#009d82" },
          { key: "untreated", label: "Kịch bản chưa xử lý", color: "#d74738" },
          ...(session.config.intervention
            ? [
                {
                  key: "treated",
                  label: "Kịch bản có phương án",
                  color: "#2478c4",
                },
              ]
            : []),
        ].map((item) => {
          const trace = session[item.key as "base" | "untreated" | "treated"];
          return (
            <div key={item.key}>
              <h3>{item.label}</h3>
              <Trend
                values={trace.powerHistory}
                times={trace.times}
                maxValue={basePower}
                unit="MW"
                label={item.label}
                color={item.color}
              />
            </div>
          );
        })}
      </details>
    </section>
  );
}
