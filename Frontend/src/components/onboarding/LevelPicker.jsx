const LEVELS = [
  { code: "A1", description: "First words and everyday phrases." },
  { code: "A2", description: "Simple conversations about familiar topics." },
  { code: "B1", description: "Handling everyday situations with confidence." },
  { code: "B2", description: "Discussing complex topics fluently." },
  { code: "C1", description: "Precise, flexible expression on most subjects." },
  { code: "C2", description: "Near-native, effortless mastery." },
];

export default function LevelPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {LEVELS.map((level) => {
        const selected = value === level.code;

        return (
          <button
            key={level.code}
            type="button"
            className={`text-left p-4 border-2 transition-all ${
              selected ? "border-secondary hard-shadow-crimson" : "border-tertiary hover:-translate-y-1 hard-shadow"
            }`}
            onClick={() => onChange(level.code)}
            aria-pressed={selected}
          >
            <span className={`font-display text-2xl ${selected ? "text-secondary" : ""}`}>{level.code}</span>
            <p className="font-body text-body-md text-on-surface-variant mt-1">{level.description}</p>
          </button>
        );
      })}
    </div>
  );
}
