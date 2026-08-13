import { useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { listenToStory } from "../../lib/api/stories.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const ACCENT_LABELS = {
  "en-US": "American English",
  "en-GB": "British English",
  "en-AU": "Australian English",
  "en-IN": "Indian English",
  "en-CA": "Canadian English",
};

export default function StoryAudioPlayer({ storyId, hasAudio }) {
  const t = useT();
  const toast = useToast();
  const [state, setState] = useState("idle");
  const [accent, setAccent] = useState(null);
  const audioRef = useRef(null);

  if (!hasAudio) return null;

  async function toggle() {
    if (state === "loading") return;

    if (audioRef.current) {
      if (state === "playing") {
        audioRef.current.pause();
        setState("paused");
      } else {
        audioRef.current.play();
        setState("playing");
      }
      return;
    }

    setState("loading");
    try {
      const res = await listenToStory(storyId);
      const audio = new Audio(res.audio_url);
      audioRef.current = audio;
      setAccent(res.accent);
      audio.onended = () => setState("idle");
      await audio.play();
      setState("playing");
    } catch (err) {
      setState("idle");
      toast.error(errorText(err));
    }
  }

  const icon = state === "loading" ? "hourglass_top" : state === "playing" ? "pause" : "play_arrow";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "loading"}
      className="flex items-center gap-3 px-6 py-3 font-label text-xs uppercase font-bold tracking-widest border-[2px] border-on-surface shadow-[3px_3px_0_0_#000] bg-surface hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
    >
      <Icon name={icon} className="text-lg" />
      {t("stories.listenAudiobook")}
      {accent && <span className="font-mono text-[10px] opacity-60 normal-case">({ACCENT_LABELS[accent] || accent})</span>}
    </button>
  );
}
