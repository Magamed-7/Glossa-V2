const COLOR_CLASSES = {
  secondary: "text-secondary",
  tertiary: "text-tertiary",
};

export default function Gauge({ value, color = "secondary", label, size = 96 }) {
  const clamped = value === null || value === undefined ? null : Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size }}>
      <div className="relative w-full h-full">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-surface-container-highest stroke-current"
            fill="none"
            strokeWidth="2"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {clamped !== null && (
            <path
              className={`${COLOR_CLASSES[color]} stroke-current`}
              fill="none"
              strokeWidth="2"
              strokeLinecap="square"
              strokeDasharray={`${clamped}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-xl">
          {clamped === null ? "—" : `${clamped}%`}
        </div>
      </div>
      {label && <span className="font-label text-label-md uppercase mt-2 text-center">{label}</span>}
    </div>
  );
}
