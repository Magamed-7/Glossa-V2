import PageHeader from "../components/layout/PageHeader.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import FeaturedLesson from "../components/grammar/FeaturedLesson.jsx";
import GrammarRoadmap from "../components/grammar/GrammarRoadmap.jsx";

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
      <FeaturedLesson />
      <GrammarRoadmap />
      <div>{/* Weak topics go here */}</div>
    </div>
  );
}
