const VARIANT_CLASSES = {
  primary:
    "bg-secondary text-on-secondary border-2 border-tertiary hard-shadow uppercase tracking-widest",
  inverse:
    "bg-surface text-tertiary border-2 border-tertiary hard-shadow uppercase tracking-tighter",
  solid:
    "bg-tertiary text-surface border border-tertiary uppercase tracking-tighter hover:bg-secondary transition-colors",
  ghost:
    "border-2 border-tertiary bg-transparent uppercase hover:bg-surface-container transition-colors",
};

const SIZE_CLASSES = {
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

export default function NeoButton({
  as: Tag = "button",
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={`font-label text-label-md btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={Tag === "button" ? disabled || loading : undefined}
      aria-disabled={Tag !== "button" ? disabled || loading : undefined}
      {...rest}
    >
      {loading ? "…" : children}
    </Tag>
  );
}
