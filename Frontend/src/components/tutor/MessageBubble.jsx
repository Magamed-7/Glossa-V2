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

  const playAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play().catch(err => console.error("Error replaying speech:", err));
    }
  };

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
        <div className="flex justify-between items-start gap-4">
          <p className={`font-body text-body-md whitespace-pre-line ${message.isError ? "italic text-on-surface-variant" : ""}`}>
            {message.text}
          </p>
          {!isUser && message.audioUrl && (
            <button
              onClick={playAudio}
              className="mt-0.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-neutral-500 dark:text-neutral-300"
              title="Прослушать"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
              </svg>
            </button>
          )}
        </div>
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
