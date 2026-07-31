import { useEffect, useRef, useState } from "react";
import { WS_URL } from "./config.js";
import { getAccessToken } from "./auth/tokens.js";
import { refreshAccessToken } from "./api/client.js";

// Протокол — API_CONTRACT.md §3.8. Обязательно закрывать сокет при размонтировании: сервер
// тикает дневной лимит посекундно всё время, пока сокет открыт, даже без переписки.
export function useAiChatSocket({ scenario, language }) {
  const [status, setStatus] = useState("connecting");
  const [messages, setMessages] = useState([]);
  const [denyReason, setDenyReason] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const socketRef = useRef(null);
  const retriedAuthRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    retriedAuthRef.current = false;

    function connect() {
      setStatus("connecting");
      const token = getAccessToken();
      const params = new URLSearchParams({ token: token || "", scenario, language });
      const socket = new WebSocket(`${WS_URL}/ws/ai/chat?${params}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "session_started") {
          setSessionId(data.session_id);
          setStatus("open");
        } else if (data.type === "message") {
          setMessages((current) => [
            ...current,
            { role: "assistant", text: data.reply, corrections: data.corrections },
          ]);
        } else if (data.type === "limit_reached") {
          setDenyReason(data.message);
          setStatus("denied");
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
          setDenyReason(event.reason || "Access denied");
          setStatus("denied");
          return;
        }

        setStatus("closed");
      };
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, language]);

  function sendMessage(text) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    setMessages((current) => [...current, { role: "user", text, corrections: null }]);
    socketRef.current.send(JSON.stringify({ text }));
  }

  return { status, messages, sessionId, denyReason, sendMessage };
}
