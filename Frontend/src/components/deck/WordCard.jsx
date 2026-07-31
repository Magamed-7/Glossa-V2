import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";

const STATUS_LABEL = {
  learning: "Learning",
  learned: "Learned",
  hard: "Hard",
  skipped: "Skipped",
};

const STATUS_CLASS = {
  learning: "border-tertiary text-on-surface",
  learned: "border-secondary text-secondary",
  hard: "border-tertiary bg-secondary-container text-on-secondary-container",
  skipped: "border-tertiary text-on-surface-variant opacity-60",
};

export default function WordCard({ card, onStatusChange, onDelete, onPlayAudio }) {
  return (
    <NeoCard className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h3 className="font-display text-2xl">{card.word}</h3>
        <span
          className={`font-label text-label-md uppercase tracking-widest border-2 px-3 py-1 ${STATUS_CLASS[card.status]}`}
        >
          {STATUS_LABEL[card.status]}
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">{card.translation}</p>
      {card.example && <p className="font-body text-body-md italic opacity-70">&ldquo;{card.example}&rdquo;</p>}

      <div className="flex items-center gap-3 mt-2 pt-3 border-t-2 border-surface-container-highest">
        <button
          type="button"
          className="text-tertiary hover:text-secondary transition-colors"
          onClick={() => onPlayAudio(card)}
          aria-label="Play pronunciation"
        >
          <Icon name="volume_up" />
        </button>
        <button
          type="button"
          className="text-tertiary hover:text-secondary transition-colors"
          onClick={() => onStatusChange(card)}
          aria-label="Change status"
        >
          <Icon name="sync_alt" />
        </button>
        <button
          type="button"
          className="ml-auto text-tertiary hover:text-error transition-colors"
          onClick={() => onDelete(card)}
          aria-label="Delete word"
        >
          <Icon name="delete" />
        </button>
      </div>
    </NeoCard>
  );
}
