import { useEffect, useRef, useState } from "react";
import { WS_URL } from "./config.js";
import { getAccessToken } from "./auth/tokens.js";
import { refreshAccessToken } from "./api/client.js";
import { LANGS, useI18n, useT } from "./i18n.jsx";

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;

const ASSISTANT_ERROR_KEYS = {
  AI_RATE_LIMITED: "tutor.aiRateLimited",
  AI_TIMEOUT: "tutor.aiTimeout",
  AI_TEMPORARILY_UNAVAILABLE: "tutor.aiTemporarilyUnavailable",
  BAD_MESSAGE: "tutor.aiTemporarilyUnavailable",
};

// Протокол — API_CONTRACT.md §3.8. Обязательно закрывать сокет при размонтировании: сервер
// тикает дневной лимит посекундно всё время, пока сокет открыт, даже без переписки.
//
// Бэкенд больше не рвёт соединение на ошибках LLM/БД (websocket_app/main.py) — присылает
// {type: "assistant_error", code} и держит сокет открытым. Здесь это превращается в реплику
// наставника тёплым тоном (ASSISTANT_ERROR_KEYS), а не в техническое сообщение. Обрыв самого
// сокета (сеть, деплой) — переподключаемся с экспоненциальной паузой, а не сразу сдаёмся.
export function useAiChatSocket({ scenario, language, tutor }) {
  const t = useT();
  const { lang } = useI18n();
  // Родной/интерфейсный язык ученика — на сервере его больше неоткуда взять (lang живёт
  // только в localStorage фронта), а он нужен наставнику, чтобы объяснять правила понятно.
  const nativeLanguage = LANGS.find((l) => l.code === lang)?.name || "Russian";
  const [status, setStatus] = useState("connecting");
  const [messages, setMessages] = useState([]);
  const [denyReason, setDenyReason] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const socketRef = useRef(null);
  const retriedAuthRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const isFirstEverMessageRef = useRef(false);
  // Открытие страницы наставника = новый разговор. Переподключение после обрыва —
  // нет, иначе потерянная на секунду сеть разрезала бы диалог надвое.
  const wantsFreshSessionRef = useRef(true);

  useEffect(() => {
    if (!tutor) {
      setStatus("connecting");
      return undefined;
    }

    let cancelled = false;
    retriedAuthRef.current = false;
    reconnectAttemptsRef.current = 0;
    wantsFreshSessionRef.current = true;

    function scheduleReconnect() {
      if (cancelled) return;

      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setStatus("closed");
        return;
      }

      setStatus("reconnecting");
      const delay = RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttemptsRef.current;
      reconnectAttemptsRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    }

    function connect() {
      if (reconnectAttemptsRef.current === 0) setStatus("connecting");

      const token = getAccessToken();
      const params = new URLSearchParams({
        token: token || "",
        scenario,
        language,
        native_language: nativeLanguage,
        tutor: tutor || "rose",
        fresh: wantsFreshSessionRef.current ? "1" : "0"
      });
      wantsFreshSessionRef.current = false;
      const socket = new WebSocket(`${WS_URL}/ws/ai/chat?${params}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "session_started") {
          reconnectAttemptsRef.current = 0;
          setSessionId(data.session_id);
          setStatus("open");
          // Сервер переиспользует свежую (в пределах суток) сессию и присылает её историю —
          // подставляем только на холодном старте (F5), не поверх уже идущего в этой вкладке
          // разговора при транзитном переподключении.
          isFirstEverMessageRef.current = !data.messages || data.messages.length === 0;
          if (data.messages && data.messages.length > 0) {
            setMessages((current) =>
              current.length > 0
                ? current
                : data.messages.map((m) => ({
                    role: m.role,
                    text: m.text,
                    corrections: m.corrections,
                    audioUrl: m.audio_url
                  }))
            );
          }
        } else if (data.type === "message") {
          setMessages((current) => {
            // corrections относятся к предыдущей реплике пользователя, а не к ответу
            // ассистента — design.html рисует их как пометки на полях у сообщения юзера.
            const updated = [...current];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === "user" && !updated[i].corrections) {
                updated[i] = { ...updated[i], corrections: data.corrections };
                break;
              }
            }
            updated.push({
              role: "assistant",
              messageId: data.message_id,
              text: data.reply,
              corrections: null,
              xpEarned: data.xp_earned,
              audioUrl: data.audio_url
            });
            // Одна системная заметка про цикл практики/уровня/XP — только после самого первого
            // ответа наставника в свежей (без истории) сессии, не от лица персонажа.
            if (isFirstEverMessageRef.current) {
              isFirstEverMessageRef.current = false;
              updated.push({ role: "note", text: t("tutor.onboardingNote") });
            }
            return updated;
          });
        } else if (data.type === "audio") {
          // Озвучка приходит отдельным кадром уже после текста (websocket_app/main.py:
          // _voice_reply), поэтому привязываем её к реплике по message_id, а не к последней
          // в списке — пока синтез шёл, ученик мог успеть отправить следующее сообщение.
          setMessages((current) =>
            current.map((m) =>
              m.role === "assistant" && m.messageId === data.message_id
                ? { ...m, audioUrl: data.audio_url }
                : m
            )
          );
        } else if (data.type === "assistant_error") {
          const key = ASSISTANT_ERROR_KEYS[data.code] || "tutor.aiTemporarilyUnavailable";
          // Реплика наставника, а не системный тост — и разблокирует поле ввода (waitingForReply
          // в TutorChat.jsx смотрит на роль последнего сообщения).
          setMessages((current) => [...current, { role: "assistant", text: t(key), corrections: null, isError: true }]);
        } else if (data.type === "limit_reached") {
          setDenyReason("limit_reached");
        }
      };

      socket.onclose = (event) => {
        if (cancelled) return;

        if (event.code === 4401 && !retriedAuthRef.current) {
          retriedAuthRef.current = true;
          refreshAccessToken().then((refreshed) => {
            if (refreshed && !cancelled) connect();
            else setStatus("denied");
          });
          return;
        }

        if (event.code === 4403 || event.code === 4401) {
          // Серверный exc.message — сырой английский текст (AppError), в UI его не показываем;
          // denyReasonDefault/limitReachedSoft уже переведены на все три языка.
          setDenyReason((current) => current || "no_access");
          setStatus("denied");
          return;
        }

        scheduleReconnect();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, language, nativeLanguage, tutor]);

  function sendMessage(text) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    setMessages((current) => [...current, { role: "user", text, corrections: null }]);
    socketRef.current.send(JSON.stringify({ text }));
  }

  return { status, messages, sessionId, denyReason, sendMessage };
}
