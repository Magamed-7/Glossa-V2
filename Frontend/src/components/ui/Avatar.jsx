const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

const DEFAULT_AVATAR = "/img/avatars/user-default.webp";

function initialFor(name, userId) {
  if (name) return name.charAt(0).toUpperCase();
  if (userId !== undefined && userId !== null) return String(userId).charAt(0);
  return "?";
}

export default function Avatar({ photoUrl, name, userId, size = "md", className = "" }) {
  const sizeClass = SIZE_CLASSES[size];

  if (photoUrl || !name) {
    return (
      <div className={`${sizeClass} border-2 border-tertiary rounded-full overflow-hidden ${className}`}>
        <img
          className="w-full h-full object-cover"
          src={photoUrl || DEFAULT_AVATAR}
          alt={name ? `${name}'s avatar` : ""}
          aria-hidden={name ? undefined : "true"}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} border-2 border-tertiary rounded-full overflow-hidden bg-secondary text-on-secondary flex items-center justify-center font-label font-bold ${className}`}
      aria-hidden="true"
    >
      {initialFor(name, userId)}
    </div>
  );
}
