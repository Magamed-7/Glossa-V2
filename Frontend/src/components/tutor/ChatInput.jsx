import { useState } from "react";
import { useT } from "../../lib/i18n.jsx";

export default function ChatInput({ disabled, onSend, tutorPreset, isDarkMode }) {
  const t = useT();
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // Dynamic style for send button and textarea based on active tutor preset
  const sendBtnStyle = tutorPreset 
    ? {
        background: isDarkMode ? tutorPreset.gradientStyleDark : tutorPreset.gradientStyleLight,
        color: "#ffffff"
      }
    : {};

  const textStyle = tutorPreset
    ? {
        borderColor: isDarkMode ? "rgba(243, 244, 246, 0.15)" : "rgba(22, 15, 34, 0.12)",
        backgroundColor: isDarkMode ? "#070608" : "#fbfaf8",
        color: isDarkMode ? "#ffffff" : "#160f22"
      }
    : {};

  return (
    <div className="flex items-end gap-3 w-full">
      <textarea
        className="flex-1 border-2 px-4 py-3 font-body text-body-md outline-none rounded-2xl resize-none transition duration-200 focus:border-neutral-400 dark:focus:border-stone-700 bg-surface-container-low border-tertiary"
        style={tutorPreset ? textStyle : {}}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={t("tutor.typeReply")}
      />
      
      <button 
        onClick={submit} 
        disabled={disabled || !text.trim()}
        className={`font-label text-label-md uppercase tracking-wider py-3.5 px-6 rounded-2xl transition duration-200 border-2 font-bold select-none cursor-pointer ${
          !tutorPreset 
            ? "bg-secondary border-black text-white hover:bg-secondary-dark" 
            : "border-black/10 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 text-white"
        } disabled:opacity-40 disabled:pointer-events-none`}
        style={sendBtnStyle}
      >
        {t("tutor.sendMessage")}
      </button>
    </div>
  );
}
