import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import AiMessageText from "./AiMessageText.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { startContextHelp, sendContextHelpMessage } from "../../lib/api/contextHelp.js";

const TXT = {
  en: {
    title: "Ask AI about this",
    placeholder: "Ask a quick question…",
    hint: "The AI already sees what you're looking at.",
    send: "Send",
    newChat: "Start a new chat",
    close: "Close",
    failed: "Couldn't reach the tutor. Your message is back in the box — try again.",
  },
  ru: {
    title: "Спросить ИИ об этом",
    placeholder: "Задай быстрый вопрос…",
    hint: "ИИ уже видит, что ты сейчас изучаешь.",
    send: "Отправить",
    newChat: "Начать новый чат",
    close: "Закрыть",
    failed: "Не получилось связаться с наставником. Сообщение вернулось в поле — попробуй ещё раз.",
  },
  tg: {
    title: "Аз ИИ дар ин бора пурсед",
    placeholder: "Саволи зудро гузоред…",
    hint: "ИИ аллакай мебинад, ки шумо чиро меомӯзед.",
    send: "Фиристодан",
    newChat: "Оғози чати нав",
    close: "Пӯшидан",
    failed: "Пайваст бо устод нашуд. Паём ба ҷои худ баргашт — боз кӯшиш кунед.",
  },
};

export default function ContextHelpChat({ contextType, contextRefId, language = "English", positionClassName = "bottom-6 right-6" }) {
  const { lang } = useI18n();
  const t = TXT[lang] || TXT.en;

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  // Holds the in-flight /start promise rather than a "started" boolean. The boolean
  // let a second caller through while the request was still running and hand back a
  // sessionId that was still null, so the message went to /context-help/null/message.
  const sessionPromiseRef = useRef(null);
  // Guards against a reply for the previous material landing in the new one after the
  // learner switches lesson/story mid-request.
  const contextKeyRef = useRef(null);
  const contextKey = `${contextType}:${contextRefId}`;

  useEffect(() => {
    contextKeyRef.current = contextKey;
    sessionPromiseRef.current = null;
    setSessionId(null);
    setMessages([]);
    setError(null);
    setLoading(false);
  }, [contextKey]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  function ensureSession({ forceNew = false } = {}) {
    if (!forceNew && sessionPromiseRef.current) return sessionPromiseRef.current;

    const requestedFor = contextKey;
    const promise = startContextHelp(contextType, contextRefId, language, forceNew)
      .then((data) => {
        if (contextKeyRef.current !== requestedFor) return null;
        setSessionId(data.session_id);
        setMessages(data.messages || []);
        return data.session_id;
      })
      .catch((err) => {
        // Clear the cached promise so the next attempt actually retries instead of
        // resolving to the same failure forever.
        if (sessionPromiseRef.current === promise) sessionPromiseRef.current = null;
        throw err;
      });

    sessionPromiseRef.current = promise;
    return promise;
  }

  async function handleOpen() {
    setOpen(true);
    setError(null);
    try {
      // First open on this page starts a clean conversation instead of resurrecting
      // yesterday's; closing and reopening the bubble keeps the current one.
      await ensureSession({ forceNew: sessionPromiseRef.current === null });
    } catch {
      setError(t.failed);
    }
  }

  async function handleNewChat() {
    setError(null);
    setLoading(true);
    setMessages([]);
    setSessionId(null);
    try {
      await ensureSession({ forceNew: true });
    } catch {
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setLoading(true);

    const optimisticUser = { id: `tmp-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const id = sessionId || (await ensureSession());
      if (!id) return;
      const data = await sendContextHelpMessage(id, text);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        data.user_message,
        data.assistant_message,
      ].filter(Boolean));
    } catch {
      // Give the learner their words back instead of silently swallowing them.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={`fixed ${positionClassName} z-40 flex items-center gap-2 border-2 border-on-surface bg-secondary text-on-secondary px-4 py-3 shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#000] transition-all cursor-pointer`}
      >
        <Icon name="auto_awesome" className="text-lg" />
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold hidden sm:inline">{t.title}</span>
      </button>
    );
  }

  return (
    <div className={`fixed ${positionClassName} z-40 w-[92vw] max-w-lg border-2 border-on-surface bg-surface shadow-[5px_5px_0_0_#000] flex flex-col max-h-[80vh]`}>
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-on-surface bg-secondary text-on-secondary">
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
          <Icon name="auto_awesome" className="text-base" />
          {t.title}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading || messages.length === 0}
            title={t.newChat}
            aria-label={t.newChat}
            className="cursor-pointer disabled:opacity-40"
          >
            <Icon name="restart_alt" className="text-lg" />
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="cursor-pointer">
            <Icon name="close" className="text-lg" />
          </button>
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
        {messages.length === 0 && (
          <p className="font-body text-xs text-on-surface-variant italic">{t.hint}</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`font-body text-sm leading-relaxed px-3 py-2 border border-on-surface/20 ${
              m.role === "user" ? "ml-auto bg-surface-container max-w-[85%]" : "bg-secondary/10"
            }`}
          >
            {m.role === "assistant" ? <AiMessageText text={m.text} /> : m.text}
          </div>
        ))}
        {loading && (
          <div className="font-body text-xs text-on-surface-variant italic">…</div>
        )}
        {error && (
          <p role="alert" className="font-body text-xs text-error border border-error/40 bg-error/10 px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t-2 border-on-surface">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t.placeholder}
          className="flex-1 border border-on-surface/40 bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="border-2 border-on-surface bg-on-surface text-surface px-3 py-2 disabled:opacity-40 cursor-pointer"
        >
          <Icon name="send" className="text-base" />
        </button>
      </div>
    </div>
  );
}
