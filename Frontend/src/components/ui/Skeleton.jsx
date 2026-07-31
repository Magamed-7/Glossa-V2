export default function Skeleton({ className = "", style }) {
  return (
    <div
      className={`bg-surface-container-highest border-2 border-tertiary animate-pulse motion-reduce:animate-none ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
