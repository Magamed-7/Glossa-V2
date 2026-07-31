import { useT } from "../../lib/i18n.jsx";

const LEVEL_CODES = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function LevelPicker({ value, onChange }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {LEVEL_CODES.map((code) => {
        const selected = value === code;

        return (
          <button
            key={code}
            type="button"
            className={`text-left p-4 border-2 transition-all ${
              selected ? "border-secondary hard-shadow-crimson" : "border-tertiary hover:-translate-y-1 hard-shadow"
            }`}
            onClick={() => onChange(code)}
            aria-pressed={selected}
          >
            <span className={`font-display text-2xl ${selected ? "text-secondary" : ""}`}>{code}</span>
            <p className="font-body text-body-md text-on-surface-variant mt-1">{t(`onboarding.levels.${code}`)}</p>
          </button>
        );
      })}
    </div>
  );
}
