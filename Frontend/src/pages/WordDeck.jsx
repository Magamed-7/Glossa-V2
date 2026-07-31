import PageHeader from "../components/layout/PageHeader.jsx";

export default function WordDeck() {
  return (
    <div>
      <PageHeader
        eyebrow="Personal Archive"
        title="Vocabulary"
        accent="Salon"
        subtitle="Every word you collect, tracked through spaced repetition until it becomes second nature."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{/* Word cards go here */}</div>
    </div>
  );
}
