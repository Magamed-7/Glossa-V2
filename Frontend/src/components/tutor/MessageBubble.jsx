import Avatar from "../ui/Avatar.jsx";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <Avatar name="AI" size="sm" />}
      <div
        className={`max-w-[75%] px-4 py-3 border-2 border-tertiary ${
          isUser ? "bg-secondary-container text-on-secondary-container" : "bg-surface"
        }`}
      >
        <p className="font-body text-body-md whitespace-pre-line">{message.text}</p>
      </div>
    </div>
  );
}
