import { useEffect, useState } from "react";
import { getAiSessions } from "../../lib/api/ai.js";
import { useT, useI18n } from "../../lib/i18n.jsx";

const LOCALES = { en: "en-GB", ru: "ru-RU", tg: "tg-TJ" };

/**
 * Прошлые разговоры этой роли — только этой.
 *
 * Собеседование, обычный разговор и визит к врачу ведутся отдельно: открыв роль, ученик
 * видит свои разговоры именно в ней и может продолжить любой, а не искать нужный среди
 * всех подряд.
 */
export default function ChatHistoryPanel({ scenario, activeSessionId, onOpenSession, onNewChat, reloadKey }) {
  const t = useT();
  const { lang } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);

    getAiSessions(scenario)
      .then((rows) => {
        if (active) setSessions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [scenario, reloadKey]);

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleDateString(LOCALES[lang] || "en-GB", { day: "numeric", month: "short" })
      + ", "
      + date.toLocaleTimeString(LOCALES[lang] || "en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  // Пустая, ещё не начатая сессия в списке не нужна: она появится, как только в ней
  // скажут первое слово.
  const started = sessions.filter((session) => session.message_count > 0 || session.id === activeSessionId);

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 dark:border-stone-800 max-h-40 md:max-h-none">
      <div className="p-3 border-b border-neutral-200 dark:border-stone-800 flex items-center justify-between gap-2">
        <span className="font-headline text-[11px] font-black uppercase tracking-wider text-neutral-600 dark:text-stone-300 min-w-0 break-words">
          {t("tutor.history.title")}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg border border-neutral-300 dark:border-stone-700 hover:bg-neutral-100 dark:hover:bg-stone-800 transition shrink-0"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <p className="p-3 font-body text-[11px] text-neutral-500 dark:text-stone-400">{t("tutor.history.loadError")}</p>
        )}

        {!error && started.length === 0 && (
          <p className="p-3 font-body text-[11px] text-neutral-500 dark:text-stone-400 leading-relaxed">
            {t("tutor.history.empty")}
          </p>
        )}

        {started.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onOpenSession(session.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-neutral-100 dark:border-stone-850 transition ${
                isActive
                  ? "bg-neutral-100 dark:bg-stone-800"
                  : "hover:bg-neutral-50 dark:hover:bg-stone-900"
              }`}
            >
              <span className="block font-body text-[11px] text-neutral-800 dark:text-stone-200 leading-snug break-words line-clamp-2">
                {session.preview || t("tutor.history.newChat")}
              </span>
              <span className="block font-label text-[9px] uppercase tracking-wide text-neutral-400 dark:text-stone-500 mt-1">
                {isActive ? t("tutor.history.current") : formatDate(session.started_at)}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
