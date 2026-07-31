import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { addWordToDeck } from "../../lib/api/stories.js";
import { errorText } from "../../lib/api/errorText.js";

// TODO(Фаза 19, i18n): показывать translation_ru/translation_tg по языку интерфейса.
// Пока интерфейс всегда английский, используем русский перевод как имеющийся по умолчанию.
export default function WordPopover({ word, storyId, onClose, onAdded }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function onAddToDeck() {
    setStatus("saving");
    setError(null);

    try {
      const card = await addWordToDeck(storyId, word.id, { locale: "en" });
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
        <p className="font-headline text-2xl text-secondary">{word.translation_ru}</p>
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
          {status === "added" ? "Added to Deck" : "Add to Deck"}
        </NeoButton>
      </div>
    </Modal>
  );
}
