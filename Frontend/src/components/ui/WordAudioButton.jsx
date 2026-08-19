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

  // Resolves once we know whether the sound actually reached the speakers: a stored URL
  // can outlive the file behind it, and that only shows up at playback time.
  function attempt(url) {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => resolve(false);
      audio.play().then(() => resolve(true)).catch(() => resolve(false));
    });
  }

  async function regenerate() {
    if (!onGenerate) return null;
    setState("generating");
    try {
      return await onGenerate();
    } catch {
      return null;
    }
  }

  async function play() {
    if (state === "generating" || state === "playing") return;

    let url = audioUrl;

    if (!url) {
      url = await regenerate();
      if (!url) {
        setState("error");
        return;
      }
    }

    setState("playing");

    if (await attempt(url)) return;

    // The recording is gone or unreachable. Ask for a fresh one rather than leaving the
    // learner staring at a broken button, which is what a dead link used to produce.
    const fresh = await regenerate();

    if (fresh && fresh !== url) {
      setState("playing");
      if (await attempt(fresh)) return;
    }

    setState("error");
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
