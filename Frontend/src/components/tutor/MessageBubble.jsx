import Avatar from "../ui/Avatar.jsx";
import Corrections from "./Corrections.jsx";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

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
        {!isUser && message.encouragement && (
          <p className="mt-2 pt-2 border-t border-outline-variant font-body text-body-md text-secondary italic">
            {message.encouragement}
          </p>
        )}
        {isUser && <Corrections corrections={message.corrections} />}
      </div>
    </div>
  );
}
