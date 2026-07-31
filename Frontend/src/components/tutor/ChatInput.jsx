import { useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function ChatInput({ disabled, onSend }) {
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

  return (
    <div className="flex items-end gap-3">
      <textarea
        className="flex-1 bg-surface-container-low border-2 border-tertiary px-4 py-3 font-body text-body-md outline-none focus:border-secondary resize-none"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={t("tutor.typeReply")}
      />
      <NeoButton onClick={submit} disabled={disabled || !text.trim()}>
        {t("tutor.sendMessage")}
      </NeoButton>
    </div>
  );
}
