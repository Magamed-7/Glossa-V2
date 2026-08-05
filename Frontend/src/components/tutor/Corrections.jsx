const SEVERITY_STYLES = {
  blocks_meaning: { border: "border-error", what: "line-through opacity-60" },
  worth_fixing: { border: "border-secondary", what: "line-through opacity-60" },
  // Полировка стиля — не показываем зачёркнутым, это не ошибка, а нюанс.
  minor: { border: "border-outline-variant", what: "opacity-70" },
};

export default function Corrections({ corrections }) {
  if (!corrections || corrections.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {corrections.map((c, i) => {
        const style = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.worth_fixing;
        return (
          <div key={i} className={`font-body text-body-md border-l-2 pl-4 ${style.border}`}>
            <p className={style.what}>{c.what}</p>
            <p className="text-on-surface-variant text-sm">{c.why}</p>
            <p className="text-secondary font-bold">{c.better}</p>
          </div>
        );
      })}
    </div>
  );
}
