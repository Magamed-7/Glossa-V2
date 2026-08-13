import { useMemo, useState, useRef, useEffect } from "react";
import WordTooltip from "./WordTooltip.jsx";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordsRegex(words) {
  const alternatives = words
    .map((w) => w.word)
    .sort((a, b) => b.length - a.length)
    .map((word) => {
      const startBoundary = /\w/.test(word[0]) ? "\\b" : "";
      const endBoundary = /\w/.test(word[word.length - 1]) ? "\\b" : "";
      return `${startBoundary}${escapeRegex(word)}${endBoundary}`;
    });
  return new RegExp(`(${alternatives.join("|")})`, "gi");
}


export default function StoryBody({ body, words, wordDictionary, storyId, level, onWordAdded }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveId(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const wordMap = useMemo(() => {
    const map = new Map();
    // Predefined words
    if (words) {
      words.forEach((w) => {
        map.set(w.word.toLowerCase(), {
          id: w.id,
          lemma: w.word,
          ru: w.translation_ru,
          tg: w.translation_tg,
          transcription: w.transcription,
          audioUrl: w.audio_url,
          accent: w.accent,
        });
      });
    }
    // Dynamic words from dictionary
    if (wordDictionary) {
      Object.entries(wordDictionary).forEach(([key, val]) => {
        if (!map.has(key)) {
          map.set(key, val);
        }
      });
    }
    return map;
  }, [words, wordDictionary]);

  const parts = useMemo(() => {
    let initialParts = [body];
    if (words && words.length > 0) {
      initialParts = body.split(buildWordsRegex(words));
    }

    const allParts = [];
    let wordIndex = 0;
    for (const part of initialParts) {
      if (wordMap.has(part.toLowerCase())) {
        allParts.push({ text: part, isPredefined: true, id: wordIndex++ });
      } else {
        const subParts = part.split(/([a-zA-Z]+(?:'[a-zA-Z]+)?)/);
        for (const sub of subParts) {
          if (sub) {
            const isWord = /^[a-zA-Z]+(?:'[a-zA-Z]+)?$/.test(sub);
            allParts.push({ text: sub, isWord, id: isWord ? wordIndex++ : null });
          }
        }
      }
    }
    return allParts;
  }, [body, words, wordMap]);

  return (
    <div className="font-body text-body-lg leading-relaxed whitespace-pre-line">
      {parts.map((partObj, i) => {
        if (partObj.isPredefined || partObj.isWord) {
          const lower = partObj.text.toLowerCase();
          const entry = wordMap.get(lower) || { lemma: lower, original: partObj.text };
          const isActive = activeId === partObj.id;

          return (
            <span key={i} className="relative inline-block">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(isActive ? null : partObj.id);
                }}
                className={`cursor-pointer border-b-[2px] transition-colors ${
                  isActive
                    ? "border-secondary bg-secondary/10"
                    : "border-transparent hover:border-secondary/50 hover:bg-secondary/5"
                }`}
              >
                {partObj.text}
              </span>
              {isActive && (
                <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2">
                  {/* Click outside listener can be added here or in WordTooltip, but since it's simple, we can add a fixed background overlay or rely on WordTooltip */}
                  <WordTooltip
                    wordData={entry}
                    storyId={storyId}
                    level={level}
                    onAdded={onWordAdded}
                    onClose={() => setActiveId(null)}
                  />
                </div>
              )}
            </span>
          );
        }

        return <span key={i}>{partObj.text}</span>;
      })}
    </div>
  );
}
