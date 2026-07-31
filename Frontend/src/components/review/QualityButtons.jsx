const OPTIONS = [
  { label: "Again", quality: 0, className: "border-tertiary text-on-surface" },
  { label: "Hard", quality: 3, className: "border-tertiary bg-secondary-container text-on-secondary-container" },
  { label: "Good", quality: 4, className: "border-secondary text-secondary" },
  { label: "Easy", quality: 5, className: "border-secondary bg-secondary text-on-secondary" },
];

export default function QualityButtons({ disabled, onAnswer }) {
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
          {opt.label}
        </button>
      ))}
    </div>
  );
}
