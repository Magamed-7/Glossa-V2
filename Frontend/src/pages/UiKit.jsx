import Icon from "../components/ui/Icon.jsx";

export default function UiKit() {
  return (
    <div className="min-h-screen bg-surface p-margin-mobile md:p-margin-desktop">
      <h1 className="font-display text-headline-lg mb-8">UI Kit</h1>

      <section className="mb-12">
        <h2 className="font-headline text-headline-md mb-4">Icon</h2>
        <div className="flex items-center gap-4">
          <Icon name="home" />
          <Icon name="home" filled />
          <Icon name="auto_stories" className="text-secondary text-3xl" />
        </div>
      </section>
    </div>
  );
}
