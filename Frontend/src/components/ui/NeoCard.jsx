const PADDING_CLASSES = {
  sm: "p-6",
  md: "p-8",
};

export default function NeoCard({
  as: Tag = "div",
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...rest
}) {
  const variantClass = variant === "accent" ? "neo-card-secondary" : "neo-card";

  return (
    <Tag className={`${variantClass} ${PADDING_CLASSES[padding]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
