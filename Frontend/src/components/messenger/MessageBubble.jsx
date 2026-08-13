import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

function formatTime(iso) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MessageBubble({ message, isMine }) {
  const t = useT();

  const bubbleClass = isMine
    ? "bg-secondary text-on-secondary ml-auto"
    : "bg-surface-container text-on-surface";

  if (message.type === "call") {
    const isMissed = message.text === "missed" || message.text === "declined";
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-tertiary bg-surface-container-low font-label text-xs uppercase tracking-wider">
          <Icon name={isMissed ? "call_missed" : "call"} className={isMissed ? "text-error" : "text-secondary"} />
          {isMissed
            ? t(`messenger.call.${message.text}`)
            : t("messenger.call.ended", { duration: formatDuration(message.attachment_duration_seconds || 0) })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] border-2 border-tertiary px-4 py-2.5 ${bubbleClass}`}>
        {message.type === "text" && (
          <p className="font-body text-body-md whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {message.type === "voice" && (
          <div className="flex items-center gap-2">
            <Icon name="graphic_eq" />
            <audio controls src={message.attachment_url} className="h-8 max-w-[220px]" />
            {message.attachment_duration_seconds != null && (
              <span className="font-mono text-xs opacity-70">{formatDuration(message.attachment_duration_seconds)}</span>
            )}
          </div>
        )}

        {message.type === "file" && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 underline decoration-2 underline-offset-2"
          >
            <Icon name="attach_file" />
            <span className="font-label text-sm truncate max-w-[200px]">{message.attachment_name || t("messenger.file")}</span>
          </a>
        )}

        <span className="block font-mono text-[10px] opacity-60 mt-1 text-right">{formatTime(message.created_at)}</span>
      </div>
    </div>
  );
}
