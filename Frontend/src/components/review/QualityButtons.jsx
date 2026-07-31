import { useT } from "../../lib/i18n.jsx";

const OPTIONS = [
  { key: "again", quality: 0, className: "border-tertiary text-on-surface" },
  { key: "hard", quality: 3, className: "border-tertiary bg-secondary-container text-on-secondary-container" },
  { key: "good", quality: 4, className: "border-secondary text-secondary" },
  { key: "easy", quality: 5, className: "border-secondary bg-secondary text-on-secondary" },
];

export default function QualityButtons({ disabled, onAnswer }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.quality}
          type="button"
          disabled={disabled}
          className={`font-label text-label-md uppercase tracking-widest py-4 border-2 btn-press transition-all disabled:opacity-40 disabled:cursor-not-allowed ${opt.className}`}
          onClick={() => onAnswer(opt.quality)}
        >
          {t(`review.quality.${opt.key}`)}
        </button>
      ))}
    </div>
  );
}
