import PageHeader from "../components/layout/PageHeader.jsx";

export default function SpacedRepetition() {
  return (
    <div>
      <PageHeader
        eyebrow="Daily Practice"
        title="The Lexical"
        accent="Gauge"
        subtitle="Review what you're about to forget, right before you forget it."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-8">
        <div className="order-2 lg:order-1">{/* Session stats */}</div>
        <div className="order-1 lg:order-2">{/* Flashcard */}</div>
        <div className="order-3">{/* Card meta */}</div>
      </div>
    </div>
  );
}
