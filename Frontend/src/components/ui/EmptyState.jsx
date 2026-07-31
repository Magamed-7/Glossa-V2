import Icon from "./Icon.jsx";

export default function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="border-2 border-dashed border-tertiary p-8 md:p-12 flex flex-col items-center text-center">
      <Icon name={icon} className="text-tertiary text-5xl mb-4" />
      <h3 className="font-headline text-headline-md mb-2">{title}</h3>
      {description && <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
