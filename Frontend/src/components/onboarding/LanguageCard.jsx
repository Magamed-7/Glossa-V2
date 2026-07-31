import Icon from "../ui/Icon.jsx";

export default function LanguageCard({ selected, onSelect, image, title, description, gateway }) {
  return (
    <button
      type="button"
      className={`group text-left relative bg-surface-container-lowest border-2 p-6 flex flex-col h-full transition-all ${
        selected ? "border-secondary hard-shadow-crimson" : "border-tertiary hard-shadow hover:-translate-y-1"
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="aspect-[4/5] w-full overflow-hidden border-2 border-tertiary mb-6">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={image}
          alt=""
          aria-hidden="true"
          loading="eager"
          width={480}
          height={600}
        />
      </div>
      <div className="flex flex-col flex-grow">
        <h3 className="font-headline text-headline-md mb-2">{title}</h3>
        <p className="font-body text-body-md text-on-surface-variant mb-6">{description}</p>
        <div className="mt-auto flex justify-between items-center">
          <span className="font-label text-label-md uppercase bg-secondary-container text-on-secondary-container px-3 py-1 border-2 border-tertiary">
            Gateway: {gateway}
          </span>
          <Icon
            name="arrow_forward"
            className={`text-secondary transition-transform ${selected ? "translate-x-1" : "group-hover:translate-x-1"}`}
          />
        </div>
      </div>
    </button>
  );
}
