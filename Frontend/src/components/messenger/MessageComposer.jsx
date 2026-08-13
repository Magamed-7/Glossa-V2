import { useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { useVoiceRecorder } from "../../lib/useVoiceRecorder.js";
import { uploadAttachment } from "../../lib/api/messenger.js";
import { useT } from "../../lib/i18n.jsx";

export default function MessageComposer({ conversationId, onSendText, onSendAttachment, onTyping }) {
  const t = useT();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const recorder = useVoiceRecorder();

  function handleTextChange(e) {
    setText(e.target.value);
    onTyping?.();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const attachment = await uploadAttachment(conversationId, file);
      const isAudio = attachment.content_type?.startsWith("audio/");
      onSendAttachment({
        messageType: isAudio ? "voice" : "file",
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
      });
    } catch (err) {
      // upload errors surface as a disabled send state; composer stays usable
    } finally {
      setUploading(false);
    }
  }

  async function handleVoiceStop() {
    const result = await recorder.stop();
    if (!result || result.duration === 0) return;

    setUploading(true);
    try {
      const file = new File([result.blob], "voice-message.webm", { type: "audio/webm" });
      const attachment = await uploadAttachment(conversationId, file);
      onSendAttachment({
        messageType: "voice",
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
        attachmentDurationSeconds: result.duration,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t-2 border-tertiary bg-surface p-4">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || recorder.isRecording}
        className="flex items-center justify-center w-11 h-11 border-2 border-tertiary hover:bg-surface-container transition-colors disabled:opacity-50 shrink-0"
        aria-label={t("messenger.attachFile")}
      >
        <Icon name="attach_file" className="text-tertiary" />
      </button>

      {recorder.isRecording ? (
        <div className="flex-1 flex items-center gap-3 border-2 border-error px-4 h-11">
          <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" aria-hidden="true" />
          <span className="font-mono text-sm">{recorder.seconds}s</span>
          <button
            type="button"
            onClick={() => recorder.cancel()}
            className="ml-auto font-label text-xs uppercase text-on-surface-variant hover:text-error"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleVoiceStop}
            className="font-label text-xs uppercase font-bold text-secondary"
          >
            {t("messenger.sendVoice")}
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={t("messenger.typeMessage")}
          disabled={uploading}
          className="flex-1 bg-surface-container-low border-2 border-tertiary h-11 px-4 font-body text-body-md outline-none focus:border-secondary disabled:opacity-50"
        />
      )}

      {!recorder.isRecording && text.trim() === "" && (
        <button
          type="button"
          onClick={() => recorder.start()}
          disabled={uploading}
          className="flex items-center justify-center w-11 h-11 border-2 border-tertiary hover:bg-surface-container transition-colors disabled:opacity-50 shrink-0"
          aria-label={t("messenger.recordVoice")}
        >
          <Icon name="mic" className="text-tertiary" />
        </button>
      )}

      {!recorder.isRecording && text.trim() !== "" && (
        <button
          type="submit"
          className="flex items-center justify-center w-11 h-11 bg-secondary text-on-secondary border-2 border-tertiary hover:opacity-90 transition-opacity shrink-0"
          aria-label={t("messenger.send")}
        >
          <Icon name="send" />
        </button>
      )}
    </form>
  );
}
