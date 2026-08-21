export default function Icon({ name, filled = false, className = "", ...rest }) {
  // Всё, что не разобрано явно, уходит на сам элемент — иначе inline-цвет и подобные
  // свойства молча теряются, и иконка остаётся чёрной, что бы ей ни передали.
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      aria-hidden="true"
      {...rest}
    >
      {name}
    </span>
  );
}
