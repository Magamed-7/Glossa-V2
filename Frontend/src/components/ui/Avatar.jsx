const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

const SIZE_PX = { sm: 32, md: 40, lg: 64, xl: 96 };

const DEFAULT_AVATAR = "/img/avatars/user-default.webp";

function initialFor(name, userId) {
  if (name) return name.charAt(0).toUpperCase();
  if (userId !== undefined && userId !== null) return String(userId).charAt(0);
  return "?";
}

export default function Avatar({ photoUrl, name, userId, size = "md", shape = "circle", className = "", eager = false }) {
  const sizeClass = SIZE_CLASSES[size];
  const px = SIZE_PX[size];
  const shapeClass = shape === "square" ? "" : "rounded-full";

  if (photoUrl || !name) {
    return (
      <div className={`${sizeClass} border-2 border-tertiary ${shapeClass} overflow-hidden ${className}`}>
        <img
          className="w-full h-full object-cover"
          src={photoUrl || DEFAULT_AVATAR}
          alt={name ? `${name}'s avatar` : ""}
          aria-hidden={name ? undefined : "true"}
          loading={eager ? "eager" : "lazy"}
          width={px}
          height={px}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} border-2 border-tertiary ${shapeClass} overflow-hidden bg-secondary text-on-secondary flex items-center justify-center font-label font-bold ${className}`}
      aria-hidden="true"
    >
      {initialFor(name, userId)}
    </div>
  );
}
