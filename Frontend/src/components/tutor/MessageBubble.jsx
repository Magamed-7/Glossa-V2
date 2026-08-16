import Avatar from "../ui/Avatar.jsx";
import Corrections from "./Corrections.jsx";

export default function MessageBubble({ message, tutorPreset, isDarkMode }) {
  const isUser = message.role === "user";

  if (message.role === "note") {
    return (
      <div className="mx-auto max-w-[85%] px-4 py-3 border-2 border-dashed border-tertiary bg-surface-container-low rounded-xl">
        <p className="font-body text-body-md italic text-on-surface-variant text-center whitespace-pre-line">
          {message.text}
        </p>
      </div>
    );
  }

  // Determine dynamic styles based on selected tutor preset
  let bubbleStyle = {};
  if (tutorPreset) {
    const borderVal = isDarkMode ? "2px solid rgba(243, 244, 246, 0.15)" : "2px solid rgba(22, 15, 34, 0.12)";
    if (isUser) {
      bubbleStyle = {
        border: borderVal,
        backgroundColor: isDarkMode ? `${tutorPreset.accentHexDark}20` : `${tutorPreset.accentHexLight}10`,
        color: isDarkMode ? "#f3f4f6" : "#160f22",
      };
    } else {
      bubbleStyle = {
        border: borderVal,
        background: isDarkMode ? tutorPreset.bubbleBgDark : tutorPreset.bubbleBgLight,
        color: isDarkMode ? "#ffffff" : "#160f22",
      };
    }
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <Avatar name="AI" size="sm" />}
      <div
        className={`max-w-[75%] px-5 py-3 rounded-2xl ${
          isUser ? "rounded-tr-none" : "rounded-tl-none"
        } shadow-sm transition-all duration-200 ${
          !tutorPreset
            ? `border-2 border-tertiary ${
                isUser
                  ? "bg-secondary-container text-on-secondary-container"
                  : message.isError
                    ? "bg-surface-container-low"
                    : "bg-surface"
              }`
            : ""
        }`}
        style={tutorPreset ? bubbleStyle : {}}
      >
        <p className={`font-body text-body-md whitespace-pre-line ${message.isError ? "italic text-on-surface-variant" : ""}`}>
          {message.text}
        </p>
        {!isUser && !!message.xpEarned && (
          <p className={`mt-2 pt-2 border-t font-label text-label-md uppercase tracking-wide ${
            tutorPreset 
              ? (isDarkMode ? "border-white/10 text-white/70" : "border-black/10 text-[#160f22]/70") 
              : "border-outline-variant text-secondary"
          }`}>
            +{message.xpEarned} XP
          </p>
        )}
        {isUser && <Corrections corrections={message.corrections} />}
      </div>
    </div>
  );
}
