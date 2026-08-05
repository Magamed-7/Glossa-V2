import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function MessageList({ messages, typing }) {
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
        <MessageBubble key={i} message={message} />
      ))}
      {typing && (
        <div className="flex items-start gap-3">
          <Avatar name="AI" size="sm" />
          <div className="max-w-[75%] px-4 py-3 border-2 border-tertiary bg-surface">
            <p className="font-body text-body-md text-on-surface-variant italic animate-pulse">{t("tutor.typing")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
