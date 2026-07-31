const VARIANT_CLASSES = {
  stamp: "bg-tertiary text-surface px-3 py-1",
  accent: "bg-secondary text-on-secondary px-2 py-0.5 text-[10px] font-bold",
  outline: "border-2 border-tertiary bg-secondary-container text-on-secondary-container px-3 py-1",
};

const LEVEL_LABELS = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2" };

export default function Badge({ variant = "stamp", level, className = "", children }) {
  if (level) {
    return (
      <span className={`font-label text-label-md uppercase tracking-widest ${VARIANT_CLASSES.outline} ${className}`}>
        {LEVEL_LABELS[level] || level}
      </span>
    );
  }

  return (
    <span className={`font-label text-label-md uppercase tracking-widest ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
