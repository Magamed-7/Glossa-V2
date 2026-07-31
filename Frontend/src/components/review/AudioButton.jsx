import { useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { generateAudio } from "../../lib/api/deck.js";

export default function AudioButton({ card, onAudioGenerated }) {
  const [state, setState] = useState("idle");
  const audioRef = useRef(null);

  async function play() {
    if (state === "generating" || state === "playing") return;

    let url = card.audio_url;

    if (!url) {
      setState("generating");
      try {
        const updated = await generateAudio(card.id);
        url = updated.audio_url;
        onAudioGenerated?.(updated);
      } catch (e) {
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
      type="button"
      className={`text-tertiary hover:text-secondary transition-colors ${state === "playing" ? "text-secondary" : ""}`}
      onClick={play}
      aria-label="Play pronunciation"
      disabled={state === "generating"}
    >
      <Icon name={icon} className="text-3xl" />
    </button>
  );
}
