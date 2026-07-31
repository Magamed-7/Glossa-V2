import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { addWordToDeck } from "../../lib/api/stories.js";
import { errorText } from "../../lib/api/errorText.js";
import { useI18n, useT } from "../../lib/i18n.jsx";

// StoryWordResponse отдаёт только translation_ru/translation_tg (schema_content.py) —
// своего "en" перевода нет, слово само по себе английское. При интерфейсе на английском
// показываем русский перевод как наиболее вероятно понятный (тот же дефолт, что был раньше).
export default function WordPopover({ word, storyId, onClose, onAdded }) {
  const t = useT();
  const { lang } = useI18n();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const translation = lang === "tg" ? word.translation_tg : word.translation_ru;

  async function onAddToDeck() {
    setStatus("saving");
    setError(null);

    try {
      const card = await addWordToDeck(storyId, word.id, { locale: lang });
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
        <p className="font-headline text-2xl text-secondary">{translation}</p>
        {word.context && <p className="font-body text-body-md italic opacity-70">&ldquo;{word.context}&rdquo;</p>}
        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}
        <NeoButton
          className="w-full"
          onClick={onAddToDeck}
          disabled={status === "added"}
          loading={status === "saving"}
        >
          {status === "added" ? t("stories.addedToDeck") : t("stories.addToDeck")}
        </NeoButton>
      </div>
    </Modal>
  );
}
