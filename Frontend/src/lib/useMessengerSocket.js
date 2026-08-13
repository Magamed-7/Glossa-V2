import { useEffect, useRef, useState } from "react";
import { WS_URL } from "./config.js";
import { getAccessToken } from "./auth/tokens.js";
import { refreshAccessToken } from "./api/client.js";

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;

// Один сокет на всю сессию мессенджера (не на разговор) — сервер сам решает, кому из
// участников какого разговора переслать событие (websocket_app/main.py, /ws/messenger).
// onEvent получает сырые кадры как есть, разбор по type — на вызывающей стороне (Messenger.jsx),
// чтобы не плодить десяток отдельных колбэков под каждый тип события.
export function useMessengerSocket(onEvent) {
  const [status, setStatus] = useState("connecting");
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let cancelled = false;
    let retriedAuth = false;
    let reconnectAttempts = 0;
    let reconnectTimer = null;

    function scheduleReconnect() {
      if (cancelled) return;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        setStatus("closed");
        return;
      }
      setStatus("reconnecting");
      const delay = RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts;
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    }

    function connect() {
      if (reconnectAttempts === 0) setStatus("connecting");

      const token = getAccessToken();
      const socket = new WebSocket(`${WS_URL}/ws/messenger?token=${encodeURIComponent(token || "")}`);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setStatus("open");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onEventRef.current?.(data);
      };

      socket.onclose = (event) => {
        if (cancelled) return;

        if (event.code === 4401 && !retriedAuth) {
          retriedAuth = true;
          refreshAccessToken().then((refreshed) => {
            if (refreshed && !cancelled) connect();
            else setStatus("denied");
          });
          return;
        }

        if (event.code === 4401) {
          setStatus("denied");
          return;
        }

        scheduleReconnect();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, []);

  function send(data) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(data));
    return true;
  }

  function sendMessage(conversationId, { messageType = "text", text, attachmentUrl, attachmentName, attachmentDurationSeconds } = {}) {
    return send({
      type: "send_message",
      conversation_id: conversationId,
      message_type: messageType,
      text,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_duration_seconds: attachmentDurationSeconds,
    });
  }

  function sendTyping(conversationId) {
    return send({ type: "typing", conversation_id: conversationId });
  }

  function sendCallSignal(conversationId, type, payload = {}) {
    return send({ type, conversation_id: conversationId, ...payload });
  }

  return { status, sendMessage, sendTyping, sendCallSignal };
}
