import { useState, useEffect } from "react";
import Modal from "../ui/Modal.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { addWordToDeck } from "../../lib/api/stories.js";
import { createCard } from "../../lib/api/deck.js";
import { errorText } from "../../lib/api/errorText.js";
import { useI18n, useT } from "../../lib/i18n.jsx";

export default function WordPopover({ word, storyId, onClose, onAdded }) {
  const t = useT();
  const { lang } = useI18n();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [dynamicTranslation, setDynamicTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(!word.id);

  const targetLang = lang === "tg" ? "tg" : "ru";
  const translation = word.id 
    ? (lang === "tg" ? word.translation_tg : word.translation_ru) 
    : dynamicTranslation;

  useEffect(() => {
    if (word.id) return;
    
    let active = true;
    setIsTranslating(true);
    
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.word)}&langpair=en|${targetLang}`)
      .then(res => res.json())
      .then(data => {
        if (active && data.responseData && data.responseData.translatedText) {
          setDynamicTranslation(data.responseData.translatedText);
        }
      })
      .catch(() => {
        if (active) setError("Translation failed");
      })
      .finally(() => {
        if (active) setIsTranslating(false);
      });
      
    return () => { active = false; };
  }, [word.word, word.id, targetLang]);

  async function onAddToDeck() {
    setStatus("saving");
    setError(null);

    try {
      let card;
      if (word.id) {
        card = await addWordToDeck(storyId, word.id, { locale: lang });
      } else {
        card = await createCard({ word: word.word, translation });
      }
      setStatus("added");
      onAdded?.(card);
    } catch (err) {
      setStatus("idle");
      setError(errorText(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={word.word}>
      <div className="space-y-4">
        {word.part_of_speech && (
          <p className="font-label text-label-md uppercase text-on-surface-variant">{word.part_of_speech}</p>
        )}
        
        {isTranslating ? (
          <div className="animate-pulse h-8 bg-surface-variant rounded w-3/4"></div>
        ) : (
          <p className="font-headline text-2xl text-secondary">{translation || "No translation found"}</p>
        )}
        
        {word.context && <p className="font-body text-body-md italic opacity-70">&ldquo;{word.context}&rdquo;</p>}
        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}
        <NeoButton
          className="w-full"
          onClick={onAddToDeck}
          disabled={status === "added" || isTranslating || (!translation && !word.id)}
          loading={status === "saving"}
        >
          {status === "added" ? t("stories.addedToDeck") : t("stories.addToDeck")}
        </NeoButton>
      </div>
    </Modal>
  );
}
