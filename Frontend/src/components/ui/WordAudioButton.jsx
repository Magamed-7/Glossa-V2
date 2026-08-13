import { forwardRef, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const ACCENT_LABELS = {
  "en-US": "US",
  "en-GB": "UK",
  "en-AU": "AU",
  "en-IN": "IN",
  "en-CA": "CA",
};

const WordAudioButton = forwardRef(function WordAudioButton({ audioUrl, accent, onGenerate, className = "" }, ref) {
  const t = useT();
  const [state, setState] = useState("idle");
  const audioRef = useRef(null);

  if (!audioUrl && !onGenerate) return null;

  async function play() {
    if (state === "generating" || state === "playing") return;

    let url = audioUrl;

    if (!url) {
      setState("generating");
      try {
        url = await onGenerate();
      } catch (e) {
        setState("error");
        return;
      }
      if (!url) {
        setState("error");
        return;
      }
    }

    setState("playing");
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("error");
    audio.play();
  }

  const icon = state === "generating" ? "hourglass_top" : state === "error" ? "error" : "volume_up";

  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center gap-1 text-tertiary hover:text-secondary transition-colors disabled:opacity-50 ${
        state === "playing" ? "text-secondary" : ""
      } ${className}`}
      onClick={play}
      aria-label={t("deck.playPronunciation")}
      disabled={state === "generating"}
    >
      <Icon name={icon} />
      {accent && <span className="font-mono text-xs opacity-60">{ACCENT_LABELS[accent] || accent}</span>}
    </button>
  );
});

export default WordAudioButton;
