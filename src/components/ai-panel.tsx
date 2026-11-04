"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import {
  buildAnalysis,
  contextKey,
  format,
  type AnalysisSelection,
} from "@/lib/analysis";

type Message = { role: "user" | "assistant"; content: string; source?: string };
type Conversation = {
  key: string;
  messages: Message[];
  loading: boolean;
  error: string;
};
export function AiPanel({
  selection,
  onSelect,
  onClear,
}: {
  selection: AnalysisSelection;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const key = contextKey(selection);
  const context = useMemo(() => buildAnalysis(selection), [key]); // key covers all scenario inputs
  const [available, setAvailable] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<string>("missing");
  const [draft, setDraft] = useState({ key, value: "" });
  if (draft.key !== key) setDraft({ key, value: "" });
  const question = draft.key === key ? draft.value : "";
  const setQuestion = (value: string) => setDraft({ key, value });
  const [conversation, setConversation] = useState<Conversation>({
    key,
    messages: [],
    loading: false,
    error: "",
  });
  const active = useRef({ key, generation: 0 });
  const pending = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  if (active.current.key !== key)
    active.current = { key, generation: active.current.generation + 1 };
  const visible =
    conversation.key === key
      ? conversation
      : { key, messages: [], loading: false, error: "" };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setAvailable(data.available === true);
        setCredentialStatus(data.credentialStatus ?? "missing");
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    pending.current?.abort();
    pending.current = null;
    setConversation({ key, messages: [], loading: false, error: "" });
    return () => {
      pending.current?.abort();
      active.current.generation++;
    };
  }, [key]);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [visible.messages.length, visible.loading]);

  async function send(kind: "chat" | "analysis", text = question) {
    if (pending.current || !available || (kind === "chat" && !text.trim()))
      return;
    const generation = ++active.current.generation;
    const controller = new AbortController();
    pending.current = controller;
    const history =
      kind === "chat"
        ? visible.messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
        : [];
    setConversation({
      key,
      messages: visible.messages,
      loading: true,
      error: "",
    });
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          context: selection,
          question: text.trim(),
          history,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "AI chưa trả lời được.");
      if (
        result.key !== key ||
        typeof result.answer !== "string" ||
        result.answer.length > 4000
      )
        throw new Error("Phản hồi không khớp ngữ cảnh.");
      if (
        active.current.key !== key ||
        active.current.generation !== generation
      )
        return;
      setConversation({
        key,
        loading: false,
        error: "",
        messages: [
          ...visible.messages,
          ...(kind === "chat"
            ? [{ role: "user" as const, content: text.trim() }]
            : []),
          {
            role: "assistant" as const,
            content: result.answer,
            source: kind === "analysis" ? "Phân tích AI" : "AI",
          },
        ].slice(-10),
      });
      if (kind === "chat") setQuestion("");
    } catch (error) {
      if (
        active.current.key !== key ||
        active.current.generation !== generation
      )
        return;
      setConversation({
        key,
        messages: visible.messages,
        loading: false,
        error: controller.signal.aborted
          ? "AI trả lời quá hạn. Bạn có thể gửi lại câu hỏi."
          : error instanceof Error
            ? error.message
            : "AI chưa trả lời được.",
      });
    } finally {
      clearTimeout(timer);
      if (pending.current === controller) pending.current = null;
    }
  }
  useEffect(() => {
    // Coalesce initial snapshot / apply events. Selection, hover, camera, and
    // draft parameter edits never create additional automatic provider calls.
    if (
      !available ||
      (selection.mode === "simulation" && !selection.submitted) ||
      seen.current.has(context.event)
    )
      return;
    const timer = setTimeout(() => {
      seen.current.add(context.event);
      void send("analysis", "");
    }, 250);
    return () => clearTimeout(timer);
  }, [context.event, key, available]);

  return (
    <section className="panel ai-panel" aria-label="Trợ lý AI">
      <div className="panel-head">
        <div>
          <h2>Trợ lý AI</h2>
        </div>
        <MessageCircle size={22} />
      </div>
      <div className="ai-context" title="Nguồn: 10:30 ICT · 02/11/2026">
        {selection.mode === "current"
          ? "Hiện trạng"
          : selection.submitted
            ? "Mô phỏng · đã áp dụng"
            : "Mô phỏng · trạng thái ban đầu"}
        <strong>
          {context.selected
            ? `${context.selected.id} · ${context.selected.name}`
            : "Toàn nhà máy"}
        </strong>
      </div>
      <div className="ai-scroll" ref={scroll}>
        <details className="rule-disclosure">
          <summary>Trạng thái hiện tại</summary>
          <section className="rule-analysis" aria-label="Trạng thái hiện tại">
            <h3>
              Trạng thái hiện tại <small>theo quy tắc</small>
            </h3>
            {context.selected && (
              <>
                <p>
                  {context.selected.operation} · {context.selected.connection}
                </p>
                <p>
                  {context.selected.signals
                    .slice(0, 2)
                    .map(
                      (signal) =>
                        `${signal.name}: ${signal.value === null ? "Chưa đủ dữ liệu" : format(signal.value)} ${signal.unit}`,
                    )
                    .join(" · ")}
                </p>
              </>
            )}
            <p>
              Đã mất{" "}
              <strong>
                {context.historical.lossMWh.toLocaleString("vi-VN", {
                  maximumFractionDigits: 4,
                })}{" "}
                MWh
              </strong>{" "}
              trong 10:00–10:30.
            </p>
            {context.selected?.signals.some((s) => s.quality !== "valid") && (
              <p role="status">
                Dữ liệu thiết bị chưa đủ chất lượng; không suy ra thiết bị hỏng
                hoặc công suất bằng 0.
              </p>
            )}
            {context.findings.map((f) => (
              <details
                key={f.id}
                open={
                  (selection.assetId !== null &&
                    f.assetIds.includes(selection.assetId)) ||
                  f.id === "scenario"
                }
              >
                <summary>{f.title}</summary>
                <p>{f.evidence}</p>
                <p>{f.impact}</p>
                <p>
                  <strong>Nên kiểm tra: </strong>
                  {f.check}
                </p>
                <small>{f.limit}</small>
                <div className="ai-device-links">
                  {f.assetIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => onSelect(id)}
                      aria-label={`Phân tích: xem ${id}`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </details>
            ))}
            <small>
              Chỉ tư vấn, cần xác minh thực tế; không điều khiển thiết bị.
            </small>
          </section>
        </details>
        <div
          className="ai-messages"
          role="log"
          aria-label="Hội thoại theo ngữ cảnh"
          aria-live="polite"
          aria-busy={visible.loading}
        >
          {visible.messages.map((m, i) => (
            <article key={i} className={`ai-message ${m.role}`}>
              <small>
                {m.role === "user" ? "Bạn" : m.source} ·{" "}
                {context.assetId ?? "Toàn nhà máy"} ·{" "}
                {selection.mode === "current" ? "Hiện trạng" : "Mô phỏng"}
              </small>
              <p>{m.content}</p>
            </article>
          ))}
          {visible.loading && (
            <p role="status">Để tôi xem và trả lời anh/chị nhé…</p>
          )}
          {visible.error && <p role="alert">{visible.error}</p>}
        </div>
      </div>
      {!available && (
        <p className="ai-status-note">
          {credentialStatus === "ready"
            ? "Gemini đã xác thực credential; hội thoại chưa bật."
            : credentialStatus === "invalid"
              ? "Credential Gemini chưa được chấp nhận."
              : credentialStatus === "unavailable"
                ? "Chưa kiểm tra được kết nối Gemini."
                : "Hội thoại API chưa được cấu hình."}{" "}
          Nhận định theo quy tắc vẫn hoạt động.
        </p>
      )}
      <form
        className="ai-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send("chat");
        }}
      >
        {context.selected && (
          <div className="ai-mention">
            <span>
              @{context.selected.id} · {context.selected.name}
            </span>
            <button
              type="button"
              aria-label="Bỏ thiết bị khỏi câu hỏi"
              onClick={onClear}
            >
              <X size={13} />
            </button>
          </div>
        )}
        <textarea
          aria-label="Nhập câu hỏi cho AI"
          placeholder={
            available
              ? context.selected
                ? "Hỏi về thiết bị này…"
                : "Hỏi về nhà máy…"
              : "Kết nối AI để bắt đầu trao đổi"
          }
          maxLength={1200}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key !== "Enter" ||
              e.shiftKey ||
              e.nativeEvent.isComposing ||
              e.nativeEvent.keyCode === 229
            )
              return;
            e.preventDefault();
            if (!visible.loading && available && question.trim())
              e.currentTarget.form?.requestSubmit();
          }}
          disabled={!available || visible.loading}
        />
        <button
          className="primary-button ai-send"
          aria-label="Gửi câu hỏi"
          title="Gửi câu hỏi"
          disabled={!available || !question.trim() || visible.loading}
        >
          <Send size={15} />
        </button>
        <small className="ai-keyboard-hint">
          Enter để gửi · Shift+Enter xuống dòng
        </small>
      </form>
    </section>
  );
}
