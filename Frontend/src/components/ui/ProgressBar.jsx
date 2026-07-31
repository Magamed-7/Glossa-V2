export default function ProgressBar({ value, max = 100, className = "" }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={`w-full h-2 bg-surface-container-highest border border-tertiary ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full bg-secondary" style={{ width: `${percent}%` }} />
    </div>
  );
}
