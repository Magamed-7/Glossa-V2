import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function MessageList({ messages, typing, tutorPreset, isDarkMode }) {
  const t = useT();
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, typing, autoScroll]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  return (
    <div ref={containerRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, i) => (
        <MessageBubble key={i} message={message} tutorPreset={tutorPreset} isDarkMode={isDarkMode} />
      ))}
      {typing && (
        <div className="flex items-start gap-3">
          <Avatar name="AI" size="sm" />
          <div 
            className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tl-none border-2 transition-all duration-200"
            style={tutorPreset ? {
              border: isDarkMode ? "2px solid rgba(243, 244, 246, 0.15)" : "2px solid rgba(22, 15, 34, 0.12)",
              background: isDarkMode ? tutorPreset.bubbleBgDark : tutorPreset.bubbleBgLight,
              color: isDarkMode ? "#ffffff" : "#160f22"
            } : {
              borderColor: "var(--color-tertiary)",
              backgroundColor: "var(--color-surface)"
            }}
          >
            <p className="font-body text-body-md italic animate-pulse">{t("tutor.typing")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
