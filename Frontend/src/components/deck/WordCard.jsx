import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const STATUS_CLASS = {
  learning: "border-tertiary text-on-surface",
  learned: "border-secondary text-secondary",
  hard: "border-tertiary bg-secondary-container text-on-secondary-container",
  skipped: "border-tertiary text-on-surface-variant opacity-60",
};

export default function WordCard({ card, onStatusChange, onDelete, onPlayAudio }) {
  const t = useT();
  return (
    <NeoCard className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="font-display text-2xl">{card.word}</h3>
          {card.transcription && (
            <span className="font-mono text-sm text-on-surface-variant italic">/{card.transcription}/</span>
          )}
        </div>
        <span
          className={`font-label text-label-md uppercase tracking-widest border-2 px-3 py-1 ${STATUS_CLASS[card.status]}`}
        >
          {t(`deck.status.${card.status}`)}
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">{card.translation}</p>
      {card.example && <p className="font-body text-body-md italic opacity-70">&ldquo;{card.example}&rdquo;</p>}

      <div className="flex items-center gap-3 mt-2 pt-3 border-t-2 border-surface-container-highest">
        <button
          type="button"
          className="text-tertiary hover:text-secondary transition-colors inline-flex items-center justify-center min-w-10 min-h-10 md:min-w-0 md:min-h-0"
          onClick={() => onPlayAudio(card)}
          aria-label={t("deck.playPronunciation")}
        >
          <Icon name="volume_up" />
        </button>
        <button
          type="button"
          className="text-tertiary hover:text-secondary transition-colors inline-flex items-center justify-center min-w-10 min-h-10 md:min-w-0 md:min-h-0"
          onClick={() => onStatusChange(card)}
          aria-label={t("deck.changeStatus")}
        >
          <Icon name="sync_alt" />
        </button>
        <button
          type="button"
          className="ml-auto text-tertiary hover:text-error transition-colors"
          onClick={() => onDelete(card)}
          aria-label={t("deck.deleteWord")}
        >
          <Icon name="delete" />
        </button>
      </div>
    </NeoCard>
  );
}
