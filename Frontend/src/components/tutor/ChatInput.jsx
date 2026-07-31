import { useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";

export default function ChatInput({ disabled, onSend }) {
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
        placeholder="Type your reply…"
      />
      <NeoButton onClick={submit} disabled={disabled || !text.trim()}>
        Send
      </NeoButton>
    </div>
  );
}
