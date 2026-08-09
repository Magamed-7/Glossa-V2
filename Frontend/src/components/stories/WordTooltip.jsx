import { useState, useEffect } from "react";
import { addWordToDeck } from "../../lib/api/stories.js";
import { createCard } from "../../lib/api/deck.js";
import { errorText } from "../../lib/api/errorText.js";
import { useI18n, useT } from "../../lib/i18n.jsx";

export default function WordTooltip({ wordData, storyId, onAdded, onClose }) {
  const t = useT();
  const { lang } = useI18n();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  
  const initialTranslation = lang === "tg" ? wordData.tg : wordData.ru;
  const [dynamicTranslation, setDynamicTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(!initialTranslation);

  const translation = initialTranslation || dynamicTranslation;
  const lemma = wordData.lemma;

  useEffect(() => {
    if (initialTranslation) return;
    
    let active = true;
    setIsTranslating(true);
    
    const targetLang = lang === "tg" ? "tg" : "ru";
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(lemma)}`)
      .then(res => res.json())
      .then(data => {
        if (active && data && data[0] && data[0][0] && data[0][0][0]) {
          setDynamicTranslation(data[0][0][0].toLowerCase().trim());
        }
      })
      .catch(() => {
        if (active) setError("Translation failed");
      })
      .finally(() => {
        if (active) setIsTranslating(false);
      });
      
    return () => { active = false; };
  }, [lemma, initialTranslation, lang]);

  async function onAddToDeck(e) {
    e.stopPropagation();
    setStatus("saving");
    setError(null);

    try {
      let card;
      if (wordData.id) {
        card = await addWordToDeck(storyId, wordData.id, { locale: lang });
      } else {
        card = await createCard({ word: lemma, translation });
      }
      setStatus("added");
      onAdded?.(card);
    } catch (err) {
      setStatus("idle");
      setError(errorText(err));
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="relative bg-surface border-[3px] border-on-surface shadow-[4px_4px_0_0_#000] p-4 w-64 flex flex-col gap-3">
      {/* Down arrow pointing to the word */}
      <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-surface border-b-[3px] border-r-[3px] border-on-surface transform rotate-45"></div>

      <div className="flex justify-between items-start">
        <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mt-1">
          {t("stories.translationTag")}
        </span>
        <button
          onClick={onAddToDeck}
          disabled={status === "added" || status === "saving"}
          className="w-7 h-7 bg-secondary text-surface border-[2px] border-on-surface flex items-center justify-center hover:bg-[#a01c33] transition-colors disabled:opacity-50 disabled:bg-surface-variant cursor-pointer"
          title={status === "added" ? t("stories.addedToDeck") : t("stories.addToDeck")}
        >
          {status === "added" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : status === "saving" ? (
            <div className="w-3 h-3 rounded-full border-2 border-surface border-t-transparent animate-spin"></div>
          ) : (
            <span className="text-lg font-bold leading-none -mt-0.5">+</span>
          )}
        </button>
      </div>

      <div className="font-headline text-lg font-bold text-on-surface break-words leading-tight">
        {isTranslating ? (
          <div className="animate-pulse h-6 bg-surface-variant rounded w-3/4"></div>
        ) : (
          translation || t("stories.noTranslationFound")
        )}
      </div>

      <div className="font-body text-xs italic text-on-surface-variant leading-relaxed">
        {t("stories.deckHint")}
      </div>

      {error && (
        <p className="font-label text-xs text-error leading-tight">{error}</p>
      )}
    </div>
  );
}
