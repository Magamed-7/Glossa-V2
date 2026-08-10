import Icon from "../ui/Icon.jsx";

export default function ScenarioCard({ scenario, title, description, featured, locked, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(scenario)}
      disabled={locked}
      className={`group relative block w-full text-left border-2 border-tertiary overflow-hidden transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        featured ? "hard-shadow-lg" : "hard-shadow hover:-translate-y-1"
      }`}
    >
      <div className={`w-full overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        {scenario.image ? (
          <img
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={scenario.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={800}
            height={600}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 ${scenario.tileClass || "bg-surface-container"}`}>
            <Icon name={scenario.icon || "chat"} className={featured ? "text-7xl" : "text-5xl"} />
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 bg-tertiary/60 flex items-center justify-center">
            <Icon name="lock" className="text-surface text-3xl" />
          </div>
        )}
      </div>
      <div className="p-4 bg-surface">
        <h3 className={`font-headline ${featured ? "text-2xl" : "text-xl"}`}>{title}</h3>
        {description && <p className="font-body text-sm text-on-surface-variant mt-1 leading-snug">{description}</p>}
      </div>
    </button>
  );
}
