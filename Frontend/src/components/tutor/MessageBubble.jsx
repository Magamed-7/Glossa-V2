import Avatar from "../ui/Avatar.jsx";
import Corrections from "./Corrections.jsx";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  if (message.role === "note") {
    return (
      <div className="mx-auto max-w-[85%] px-4 py-3 border-2 border-dashed border-tertiary bg-surface-container-low">
        <p className="font-body text-body-md italic text-on-surface-variant text-center whitespace-pre-line">
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <Avatar name="AI" size="sm" />}
      <div
        className={`max-w-[75%] px-4 py-3 border-2 border-tertiary ${
          isUser
            ? "bg-secondary-container text-on-secondary-container"
            : message.isError
              ? "bg-surface-container-low"
              : "bg-surface"
        }`}
      >
        <p className={`font-body text-body-md whitespace-pre-line ${message.isError ? "italic text-on-surface-variant" : ""}`}>
          {message.text}
        </p>
        {!isUser && !!message.xpEarned && (
          <p className="mt-2 pt-2 border-t border-outline-variant font-label text-label-md uppercase tracking-wide text-secondary">
            +{message.xpEarned} XP
          </p>
        )}
        {isUser && <Corrections corrections={message.corrections} />}
      </div>
    </div>
  );
}
