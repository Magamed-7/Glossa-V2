import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { startContextHelp, sendContextHelpMessage } from "../../lib/api/contextHelp.js";

const TXT = {
  en: {
    title: "Ask AI about this",
    placeholder: "Ask a quick question…",
    hint: "The AI already sees what you're looking at.",
    send: "Send",
  },
  ru: {
    title: "Спросить ИИ об этом",
    placeholder: "Задай быстрый вопрос…",
    hint: "ИИ уже видит, что ты сейчас изучаешь.",
    send: "Отправить",
  },
  tg: {
    title: "Аз ИИ дар ин бора пурсед",
    placeholder: "Саволи зудро гузоред…",
    hint: "ИИ аллакай мебинад, ки шумо чиро меомӯзед.",
    send: "Фиристодан",
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
  const [started, setStarted] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setStarted(false);
  }, [contextType, contextRefId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function ensureSession() {
    if (started) return sessionId;
    setStarted(true);
    const data = await startContextHelp(contextType, contextRefId, language);
    setSessionId(data.session_id);
    setMessages(data.messages || []);
    return data.session_id;
  }

  async function handleOpen() {
    setOpen(true);
    try {
      await ensureSession();
    } catch {
      setStarted(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    const optimisticUser = { id: `tmp-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const id = sessionId || (await ensureSession());
      const data = await sendContextHelpMessage(id, text);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        data.user_message,
        data.assistant_message,
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
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
    <div className={`fixed ${positionClassName} z-40 w-[92vw] max-w-sm border-2 border-on-surface bg-surface shadow-[5px_5px_0_0_#000] flex flex-col max-h-[70vh]`}>
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-on-surface bg-secondary text-on-secondary">
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
          <Icon name="auto_awesome" className="text-base" />
          {t.title}
        </span>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer">
          <Icon name="close" className="text-lg" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
        {messages.length === 0 && (
          <p className="font-body text-xs text-on-surface-variant italic">{t.hint}</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`font-body text-sm leading-relaxed px-3 py-2 border border-on-surface/20 max-w-[85%] ${
              m.role === "user" ? "ml-auto bg-surface-container" : "bg-secondary/10"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="font-body text-xs text-on-surface-variant italic">…</div>
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
