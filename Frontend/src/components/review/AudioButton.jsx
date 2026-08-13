import { forwardRef } from "react";
import WordAudioButton from "../ui/WordAudioButton.jsx";
import { generateAudio } from "../../lib/api/deck.js";

const AudioButton = forwardRef(function AudioButton({ card, onAudioGenerated }, ref) {
  async function handleGenerate() {
    const updated = await generateAudio(card.id);
    onAudioGenerated?.(updated);
    return updated.audio_url;
  }

  return (
    <WordAudioButton
      ref={ref}
      audioUrl={card.audio_url}
      accent={card.accent}
      onGenerate={handleGenerate}
      className="text-3xl"
    />
  );
});

export default AudioButton;
