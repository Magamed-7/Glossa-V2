export default function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    /*
      Переключатель нарисован в 52x28 — так он и должен выглядеть. Но пальцем в 28 точек
      попадать тяжело, поэтому на телефоне кнопка берёт отступ вокруг себя и тем же
      отрицательным полем возвращает соседям прежнее расстояние: зона нажатия становится
      выше, а вёрстка не меняется.
    */
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="shrink-0 w-fit self-start p-2 -m-2 md:p-0 md:m-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span
        className={`relative block w-[52px] h-[28px] rounded-full border-2 border-tertiary transition-colors ${
          checked ? "bg-secondary" : "bg-surface-container-high"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white border border-tertiary transition-transform ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
