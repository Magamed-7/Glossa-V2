import Icon from "../ui/Icon.jsx";

export default function Fab({ icon = "add", label, onClick }) {
  return (
    <button
      className="fixed bottom-24 right-8 w-16 h-16 bg-secondary text-on-secondary rounded-full border-2 border-tertiary hard-shadow hidden md:flex items-center justify-center hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all z-40"
      onClick={onClick}
      aria-label={label}
    >
      <Icon name={icon} className="text-3xl" />
    </button>
  );
}
