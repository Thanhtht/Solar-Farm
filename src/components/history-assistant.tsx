"use client";
import { useEffect, useRef, useState } from "react";
import { historyModel } from "@/data/history-model";
import type { EnergySummary } from "@/lib/performance-history";
export function HistoryAssistant({
  active,
  start,
  end,
  assetId,
  summary,
}: {
  active: boolean;
  start: string;
  end: string;
  assetId: string | null;
  summary: EnergySummary;
}) {
  const key = JSON.stringify([
    "history",
    start,
    end,
    assetId,
    historyModel.version,
  ]);
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
      key: string;
      label: string;
    }[]
  >([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const chatLog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && chatLog.current)
      chatLog.current.scrollTop = chatLog.current.scrollHeight;
  }, [messages.length, active]);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    controller.current?.abort();
    setWaiting(false);
    setError("");
    return () => {
      generation.current++;
      controller.current?.abort();
    };
  }, [key, active]);
  async function send(question: string) {
    if (!question.trim() || waiting || !active) return;
    const id = ++generation.current;
    const control = new AbortController();
    controller.current = control;
    setWaiting(true);
    setError("");
    const label = `${start === end ? start : `${start} – ${end}`} · ${assetId ?? "Toàn nhà máy"}`;
    const timer = setTimeout(() => control.abort(), 25000);
    try {
      const payload = {
        kind: "chat",
        context: { mode: "history", start, end, assetId },
        question,
        history: messages
          .filter((m) => m.key === key)
          .slice(-6)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, 2000),
            context: { key: m.key },
          })),
      };
      while (
        payload.history.length &&
        new TextEncoder().encode(JSON.stringify(payload)).byteLength > 19000
      )
        payload.history.shift();
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: control.signal,
        body: JSON.stringify(payload),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "AI chưa trả lời được.");
      if (
        result.key !== key ||
        typeof result.answer !== "string" ||
        result.answer.length > 4000
      )
        throw new Error("Phản hồi không khớp ngày/khoảng đang xem.");
      if (id !== generation.current) return;
      setMessages((m) => [
        ...m,
        { role: "user", content: question, key, label },
        { role: "assistant", content: result.answer, key, label },
      ]);
      setDraft("");
    } catch (e) {
      if (id === generation.current)
        setError(
          control.signal.aborted
            ? "Yêu cầu đã quá hạn. Bạn có thể thử lại."
            : e instanceof Error
              ? e.message
              : "Không kết nối được AI.",
        );
    } finally {
      clearTimeout(timer);
      if (id === generation.current) setWaiting(false);
    }
  }
  return (
    <section
      className="history-panel history-assistant"
      aria-label="Trợ lý AI lịch sử"
    >
      <h2>Trợ lý phân tích lịch sử</h2>
      <p className="history-muted">
        {start === end ? `Ngày ${start}` : `Khoảng ${start} – ${end}`} ·{" "}
        {assetId ?? "Toàn nhà máy"}
      </p>
      <p className="history-muted">
        Sản lượng ghi nhận{" "}
        {summary.actualEnergyMWh?.toLocaleString("vi-VN", {
          maximumFractionDigits: 2,
        }) ?? "chưa có dữ liệu"}{" "}
        MWh · Đạt kỳ vọng {summary.performancePct?.toFixed(1) ?? "—"}% · Độ phủ{" "}
        {summary.coveragePct?.toFixed(1) ?? "—"}%. Phiên riêng của Hiệu suất.
      </p>
      <button
        disabled={waiting}
        onClick={() =>
          send(
            "Phân tích ngày hoặc khoảng đang chọn: nêu khác biệt chính giữa các cụm, mức đạt kỳ vọng và chất lượng dữ liệu.",
          )
        }
      >
        Phân tích lựa chọn này
      </button>
      <div ref={chatLog} className="history-chat-log" aria-live="polite">
        {messages.map((m, i) => (
          <article key={i} className={`history-chat-${m.role}`}>
            <small>
              {m.role === "user" ? "Bạn" : "AI"} · {m.label}
            </small>
            <p>{m.content}</p>
          </article>
        ))}
      </div>
      {error && (
        <p role="alert" className="history-error">
          {error}
        </p>
      )}
      {waiting && <p role="status">Đang phân tích dữ liệu đã chọn…</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <label>
          Hỏi về dữ liệu đang xem
          <textarea
            aria-label="Hỏi AI lịch sử"
            value={draft}
            maxLength={1200}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send(draft);
              }
            }}
          />
        </label>
        <button disabled={waiting || !draft.trim()} type="submit">
          Gửi
        </button>
      </form>
    </section>
  );
}
