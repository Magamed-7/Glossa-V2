import Icon from "../ui/Icon.jsx";

export default function ScenarioCard({ scenario, featured, locked, onSelect }) {
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
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={scenario.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={800}
          height={600}
        />
        {locked && (
          <div className="absolute inset-0 bg-tertiary/60 flex items-center justify-center">
            <Icon name="lock" className="text-surface text-3xl" />
          </div>
        )}
      </div>
      <div className="p-4 bg-surface">
        <h3 className={`font-headline ${featured ? "text-2xl" : "text-xl"}`}>{scenario.title}</h3>
      </div>
    </button>
  );
}
