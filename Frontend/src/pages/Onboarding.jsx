export default function Onboarding() {
  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <header className="w-full px-margin-mobile md:px-margin-desktop py-8 max-w-7xl mx-auto flex justify-between items-center relative z-10">
        <span className="font-headline text-headline-lg text-tertiary italic">Glossa</span>
        <span className="hidden md:block font-label text-label-md text-on-surface-variant uppercase tracking-widest">
          Onboarding Protocol 1.0
        </span>
      </header>

      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 relative z-10">
        <div className="mb-section-gap max-w-3xl">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
            Choose Your <span className="italic text-secondary">Destination</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
            Linguistic mastery begins with a single step. Select the cultural landscape you wish to traverse
            and immerse yourself in our curated editorial curriculum.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-2 bg-tertiary" />
    </div>
  );
}
