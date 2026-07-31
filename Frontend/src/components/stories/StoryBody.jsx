import { useMemo, useState } from "react";
import WordPopover from "./WordPopover.jsx";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordsRegex(words) {
  const escaped = words.map((w) => escapeRegex(w.word)).sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

export default function StoryBody({ body, words, storyId, onWordAdded }) {
  const [active, setActive] = useState(null);

  const wordMap = useMemo(() => {
    const map = new Map();
    words.forEach((w) => map.set(w.word.toLowerCase(), w));
    return map;
  }, [words]);

  const parts = useMemo(() => {
    if (words.length === 0) return [body];
    return body.split(buildWordsRegex(words));
  }, [body, words]);

  return (
    <div className="font-body text-body-lg leading-relaxed whitespace-pre-line">
      {parts.map((part, i) => {
        const entry = wordMap.get(part.toLowerCase());

        if (entry) {
          return (
            <button
              key={i}
              type="button"
              className="underline decoration-secondary decoration-dotted underline-offset-4 hover:text-secondary"
              onClick={() => setActive(entry)}
            >
              {part}
            </button>
          );
        }

        return <span key={i}>{part}</span>;
      })}

      {active && (
        <WordPopover word={active} storyId={storyId} onClose={() => setActive(null)} onAdded={onWordAdded} />
      )}
    </div>
  );
}
