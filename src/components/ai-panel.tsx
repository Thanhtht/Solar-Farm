"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  X,
  LoaderCircle,
  Cpu,
  Grid2X2,
  Search,
  ChevronRight,
} from "lucide-react";
import { assets, scenarios } from "@/data/plant";
import {
  buildAnalysis,
  contextKey,
  eventKey,
  format,
  type AnalysisSelection,
} from "@/lib/analysis";

import {
  readSimulationAction,
  referencedAssets,
  type SimulationAction,
} from "@/lib/assistant-actions";

type Mode = AnalysisSelection["mode"];
function useModeState<T>(mode: Mode, initial: T) {
  const [values, setValues] = useState<Record<Mode, T>>({
    current: initial,
    simulation: initial,
  });
  const setValue = (update: T | ((previous: T) => T)) =>
    setValues((previous) => ({
      ...previous,
      [mode]:
        typeof update === "function"
          ? (update as (v: T) => T)(previous[mode])
          : update,
    }));
  return [values[mode], setValue] as const;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: string;
  context: AnalysisSelection;
  focusAssetId?: string | null;
  guide?: boolean;
};
const sourceLabel = (s: AnalysisSelection) =>
  `${s.assetId ?? "Toàn nhà máy"} · ${s.mode === "current" ? "Hiện trạng" : s.submitted ? `Mô phỏng · ${scenarios.find((x) => x.id === s.config.kind)?.name ?? "Kết quả"} · ${s.config.duration / 60} giờ` : "Mô phỏng · ban đầu"}`;
const searchable = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
export function AiPanel({
  selection,
  onSelect,
  onMention,
  onClear,
  onFocus,
  onAction,
}: {
  selection: AnalysisSelection;
  onSelect: (id: string) => void;
  onMention: (id: string) => void;
  onClear: () => void;
  onFocus: (id: string) => void;
  onAction: (
    action: SimulationAction,
    source: AnalysisSelection,
  ) => AnalysisSelection | null;
}) {
  const key = contextKey(selection);
  const context = useMemo(() => buildAnalysis(selection), [key]);
  const [available, setAvailable] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState("missing");
  const [question, setQuestion] = useModeState(selection.mode, "");
  const [messages, setMessages] = useModeState<Message[]>(selection.mode, []);
  const [waiting, setWaiting] = useModeState<AnalysisSelection | null>(
    selection.mode,
    null,
  );
  const [error, setError] = useModeState<{
    message: string;
    context: AnalysisSelection;
  } | null>(selection.mode, null);
  const pending = useRef<Record<Mode, AbortController | null>>({
    current: null,
    simulation: null,
  });
  const generation = useRef<Record<Mode, number>>({
    current: 0,
    simulation: 0,
  });
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const seen = useRef(new Set<string>());
  const [cursor, setCursor] = useState(0);
  const [option, setOption] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const prefix = question.slice(0, cursor);
  const mention = prefix.match(/(^|\s)@([^@\n]*)$/);
  const showSuggestions = Boolean(mention && dismissed !== prefix && !waiting);
  const suggestions = mention
    ? assets.filter((a) =>
        searchable(`${a.id} ${a.name}`).includes(searchable(mention[2].trim())),
      )
    : [];
  const activeOption = suggestions.length ? option % suggestions.length : 0;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setAvailable(data.available === true);
        setCredentialStatus(data.credentialStatus ?? "missing");
      })
      .catch(() => setCredentialStatus("unavailable"));
    return () => controller.abort();
  }, []);
  useEffect(
    () => () => {
      for (const mode of ["current", "simulation"] as const) {
        generation.current[mode]++;
        pending.current[mode]?.abort();
      }
    },
    [],
  );
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages.length, waiting, selection.mode]);
  useEffect(() => {
    if (showSuggestions)
      document
        .getElementById(`ai-option-${activeOption}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [showSuggestions, activeOption]);

  useEffect(() => {
    setCursor(question.length);
    setOption(0);
    setDismissed(null);
  }, [selection.mode]);

  function chooseMention(id: string) {
    if (!mention) return;
    const start = cursor - mention[2].length - 1;
    setQuestion(question.slice(0, start) + question.slice(cursor));
    setCursor(start);
    setOption(0);
    setDismissed(null);
    onMention(id);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(start, start);
    });
  }
  async function send(
    kind: "chat" | "analysis",
    text = question,
    source = selection,
  ) {
    if (
      pending.current[source.mode] ||
      !available ||
      (kind === "chat" && !text.trim())
    )
      return;
    const askedAsset =
      kind === "chat" && source.mode === "current"
        ? (referencedAssets(text)[0] ?? source.assetId)
        : null;
    const captured = structuredClone(
        askedAsset ? { ...source, assetId: askedAsset } : source,
      ),
      requestKey = contextKey(captured);
    if (askedAsset) onFocus(askedAsset);
    const requestId = ++generation.current[source.mode];
    const controller = new AbortController();
    pending.current[source.mode] = controller;
    seen.current.add(eventKey(captured));
    const history =
      kind === "chat"
        ? messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content.slice(0, 2000),
            context: m.context,
          }))
        : [];
    // Keep the visible session intact; only bound the context sent upstream.
    while (
      history.length &&
      new TextEncoder().encode(
        JSON.stringify({
          kind,
          context: captured,
          question: text.trim(),
          history,
        }),
      ).byteLength > 19000
    )
      history.shift();
    setWaiting(captured);
    setError(null);
    setDismissed(prefix);
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          context: captured,
          question: text.trim(),
          history,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "AI chưa trả lời được.");
      if (
        result.key !== requestKey ||
        typeof result.answer !== "string" ||
        result.answer.length > 4000
      )
        throw new Error("Phản hồi không khớp câu hỏi.");
      if (generation.current[source.mode] !== requestId) return;
      let answer = result.answer;
      let responseContext = captured;
      if (result.action) {
        const action = readSimulationAction(result.action, captured);
        const next = onAction(action, captured);
        if (next) {
          responseContext = next;
          seen.current.add(eventKey(next));
        } else {
          answer =
            "Anh/chị đã chuyển chế độ hoặc thay đổi thiết lập trong lúc tôi xử lý, nên tôi chưa áp dụng lệnh này. Anh/chị có thể gửi lại yêu cầu trong tab Mô phỏng với thiết lập đang xem.";
        }
      }
      const focusAssetId =
        captured.mode === "current" && kind === "chat"
          ? (askedAsset ??
            (assets.some((a) => a.id === result.focusAssetId)
              ? result.focusAssetId
              : (referencedAssets(answer)[0] ?? null)))
          : null;
      if (focusAssetId && focusAssetId !== askedAsset) onFocus(focusAssetId);
      setMessages((previous) => [
        ...previous,
        ...(kind === "chat"
          ? [{ role: "user" as const, content: text.trim(), context: captured }]
          : []),
        {
          role: "assistant",
          content: answer,
          source: kind === "analysis" ? "Phân tích AI" : "AI",
          context: responseContext,
          focusAssetId,
          guide:
            kind === "analysis" &&
            captured.mode === "current" &&
            !messages.some((m) => m.guide),
        },
      ]);
      if (kind === "chat")
        setQuestion((current) => (current === text ? "" : current));
    } catch (failure) {
      if (generation.current[source.mode] !== requestId) return;
      setError({
        context: captured,
        message: controller.signal.aborted
          ? "AI trả lời quá hạn. Anh/chị có thể gửi lại câu hỏi."
          : failure instanceof Error
            ? failure.message
            : "AI chưa trả lời được.",
      });
    } finally {
      clearTimeout(timer);
      if (pending.current[source.mode] === controller) {
        pending.current[source.mode] = null;
        setWaiting(null);
      }
    }
  }
  useEffect(() => {
    if (
      !available ||
      waiting ||
      (selection.mode === "simulation" && !selection.submitted) ||
      seen.current.has(context.event)
    )
      return;
    const timer = setTimeout(() => {
      void send("analysis", "", { ...selection, assetId: null });
    }, 250);
    return () => clearTimeout(timer);
  }, [context.event, available, waiting]);

  return (
    <section className="panel ai-panel" aria-label="Trợ lý AI">
      <div className="panel-head">
        <div>
          <h2>Trợ lý AI</h2>
        </div>
        <MessageCircle size={22} />
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
          aria-busy={Boolean(waiting)}
        >
          {messages.map((m, i) => (
            <article
              key={i}
              className={`ai-message ${m.role}`}
              data-asset-id={m.context.assetId ?? "plant"}
              data-mode={m.context.mode}
              title={`Dữ liệu 10:30 ICT · ${sourceLabel(m.context)}`}
            >
              <small>
                {m.role === "user" ? "Anh/chị" : m.source} ·{" "}
                {sourceLabel(m.context)}
                {m.focusAssetId && m.focusAssetId !== m.context.assetId && (
                  <span className="ai-focus-label">
                    {" "}
                    · Trọng tâm: {m.focusAssetId}
                  </span>
                )}
              </small>
              <p>{m.content}</p>
              {m.guide && (
                <p className="ai-guide">
                  Anh/chị có thể hỏi về nhà máy, gõ @ để chọn thiết bị hoặc sang
                  Mô phỏng để nhờ tôi thiết lập tình huống.
                </p>
              )}
            </article>
          ))}
          {Boolean(waiting) && (
            <p role="status">
              Anh/Chị chờ em một chút nhé…{" "}
              <small>{waiting && sourceLabel(waiting)}</small>
            </p>
          )}
          {error && (
            <p role="alert">
              {error.message} <small>{sourceLabel(error.context)}</small>
            </p>
          )}
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
              onClick={() => {
                onClear();
                requestAnimationFrame(() => input.current?.focus());
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}
        {showSuggestions && (
          <div
            className="ai-suggestions"
            role="listbox"
            id="ai-device-suggestions"
            aria-label="Gợi ý thiết bị"
          >
            <div className="ai-suggestion-heading">
              <Search size={13} />
              <span>Chọn thiết bị</span>
              <small>{suggestions.length}</small>
            </div>
            {suggestions.length ? (
              suggestions.map((asset, index) => (
                <button
                  key={asset.id}
                  id={`ai-option-${index}`}
                  className="ai-option"
                  type="button"
                  role="option"
                  aria-selected={index === activeOption}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseMention(asset.id)}
                >
                  <span className={`ai-option-icon ${asset.type}`}>
                    {asset.type === "pv" ? (
                      <Grid2X2 size={16} />
                    ) : (
                      <Cpu size={16} />
                    )}
                  </span>
                  <span className="ai-option-info">
                    <span>{asset.name}</span>
                    <small>{asset.area}</small>
                  </span>
                  <strong>@{asset.id}</strong>
                  <ChevronRight size={13} className="ai-option-arrow" />
                </button>
              ))
            ) : (
              <p role="status">
                Không tìm thấy thiết bị. Thử mã hoặc tên khác.
              </p>
            )}
          </div>
        )}
        <textarea
          ref={input}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? "ai-device-suggestions" : undefined}
          aria-activedescendant={
            showSuggestions && suggestions.length
              ? `ai-option-${activeOption}`
              : undefined
          }
          aria-label="Nhập câu hỏi cho AI"
          placeholder={
            available
              ? context.selected
                ? "Hỏi về thiết bị này…"
                : "Hỏi về nhà máy hoặc gõ @thiết bị…"
              : "Kết nối AI để bắt đầu trao đổi"
          }
          maxLength={1200}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setCursor(e.target.selectionStart);
            setOption(0);
            setDismissed(null);
          }}
          onClick={(e) => setCursor(e.currentTarget.selectionStart)}
          onKeyUp={(e) => setCursor(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229)
              return;
            if (showSuggestions && !e.shiftKey) {
              if (e.key === "Escape") {
                e.preventDefault();
                setDismissed(prefix);
                return;
              }
              if (
                suggestions.length &&
                ["ArrowDown", "ArrowUp"].includes(e.key)
              ) {
                e.preventDefault();
                setOption(
                  (current) =>
                    (current +
                      (e.key === "ArrowDown" ? 1 : suggestions.length - 1)) %
                    suggestions.length,
                );
                return;
              }
              if (suggestions.length && ["Enter", "Tab"].includes(e.key)) {
                e.preventDefault();
                chooseMention(suggestions[activeOption].id);
                return;
              }
            }
            if (e.key !== "Enter" || e.shiftKey) return;
            e.preventDefault();
            if (!waiting && available && question.trim())
              e.currentTarget.form?.requestSubmit();
          }}
          disabled={!available || Boolean(waiting)}
        />
        <button
          className="primary-button ai-send"
          aria-label="Gửi câu hỏi"
          title="Gửi câu hỏi"
          disabled={!available || !question.trim() || Boolean(waiting)}
        >
          {waiting ? (
            <LoaderCircle size={17} className="ai-spinner" />
          ) : (
            <Send size={17} />
          )}
        </button>
        <small className="ai-keyboard-hint">
          {showSuggestions
            ? "↑↓ chọn · Enter xác nhận · Esc đóng"
            : "Enter để gửi · Shift+Enter xuống dòng"}
        </small>
      </form>
    </section>
  );
}
