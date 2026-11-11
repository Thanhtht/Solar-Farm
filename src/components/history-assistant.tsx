"use client";
import { usePlant } from "./plant-context";
import { AssistantHeader } from "./assistant-chrome";
import { Send, UserRound, Sparkles, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resolveHistoryQuestion } from "@/lib/history-question";
import type { HistoryWindow } from "@/lib/history-dates";
import { historyModel } from "@/data/history-model";
import type { EnergySummary } from "@/lib/performance-history";
export function HistoryAssistant({
  active,
  window,
  start,
  end,
  assetId,
  summary,
}: {
  active: boolean;
  window: HistoryWindow;
  start: string;
  end: string;
  assetId: string | null;
  summary: EnergySummary;
}) {
  const { plantId } = usePlant();
  const key = JSON.stringify([
    "history",
    start,
    end,
    assetId,
    historyModel.version,
    ...(plantId !== "sava" ? [plantId] : []),
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

    const timer = setTimeout(() => control.abort(), 25000);
    try {
      const resolved = resolveHistoryQuestion(
        {
          ...(plantId !== "sava" ? { plantId } : {}),
          mode: "history",
          start,
          end,
          assetId,
        },
        question,
        window,
      );
      const source = resolved.context;
      const requestKey = JSON.stringify([
        "history",
        source.start,
        source.end,
        source.assetId,
        historyModel.version,
        ...(plantId !== "sava" ? [plantId] : []),
      ]);
      const label = `${source.start === source.end ? source.start : `${source.start} – ${source.end}`} · ${source.assetId ?? "Toàn nhà máy"}`;
      const payload = {
        kind: "chat",
        context: source,
        question,
        history: messages
          .filter((m) => m.key === requestKey)
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
        result.key !== requestKey ||
        typeof result.answer !== "string" ||
        result.answer.length > 4000
      )
        throw new Error("Phản hồi không khớp ngày/khoảng đang xem.");
      if (id !== generation.current) return;
      setMessages((m) => [
        ...m,
        { role: "user", content: question, key: requestKey, label },
        { role: "assistant", content: result.answer, key: requestKey, label },
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
      className="panel ai-panel history-assistant"
      aria-label="Trợ lý AI lịch sử"
    >
      <AssistantHeader />
      <div className="ai-scroll" ref={chatLog}>
        <details className="rule-disclosure">
          <summary>Thống kê đang chọn</summary>
          <p className="history-muted">
            {start === end ? `Ngày ${start}` : `Khoảng ${start} – ${end}`} ·{" "}
            {assetId ?? "Toàn nhà máy"}
          </p>
          <p className="history-muted">
            Sản lượng ghi nhận{" "}
            {summary.actualEnergyMWh?.toLocaleString("vi-VN", {
              maximumFractionDigits: 2,
            }) ?? "chưa có dữ liệu"}{" "}
            MWh · Hiệu suất {summary.performancePct?.toFixed(1) ?? "—"}% · Độ
            phủ {summary.coveragePct?.toFixed(1) ?? "—"}%. Phiên riêng của Thống
            kê.
          </p>
        </details>
        <button
          className="history-analysis-request"
          disabled={waiting}
          onClick={() =>
            send(
              "Phân tích ngày hoặc khoảng đang chọn: nêu khác biệt chính giữa các cụm, hiệu suất và chất lượng dữ liệu.",
            )
          }
        >
          Phân tích lựa chọn này
        </button>
        <div
          className="ai-messages history-chat-log"
          role="log"
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <article key={i} className={`ai-message ${m.role}`}>
              <small className="ai-message-meta">
                <span className="ai-message-role">
                  {m.role === "user" ? (
                    <UserRound size={12} />
                  ) : (
                    <Sparkles size={12} />
                  )}{" "}
                  {m.role === "user" ? "Anh/chị" : "Trợ lý AI"}
                </span>{" "}
                · {m.label}
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
      </div>
      <form
        className="ai-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <div className="history-compose-box">
          <textarea
            placeholder="Hỏi về ngày hoặc khoảng đang chọn…"
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
          <button
            className="ai-send"
            aria-label="Gửi"
            title="Gửi câu hỏi"
            disabled={waiting || !draft.trim()}
            type="submit"
          >
            {waiting ? (
              <LoaderCircle size={17} className="ai-spinner" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>
        <small className="ai-keyboard-hint">
          Enter để gửi · Shift+Enter xuống dòng
        </small>
      </form>
    </section>
  );
}
