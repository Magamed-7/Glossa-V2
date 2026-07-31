import PageHeader from "../components/layout/PageHeader.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";

export default function GrammarHub() {
  return (
    <div className="relative">
      <DecorativeBackground variant="rays" />
      <PageHeader
        eyebrow="Structural Analysis"
        title="The Syntactic"
        accent="Ledger"
        subtitle="Every rule you've mastered, and every one still worth revising."
      />
      <div>{/* Featured lesson, roadmap, weak topics go here */}</div>
    </div>
  );
}
