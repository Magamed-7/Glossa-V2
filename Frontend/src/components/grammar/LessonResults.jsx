import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";

export default function LessonResults({ result }) {
  return (
    <div className="space-y-6">
      <NeoCard variant="accent">
        <h3 className="font-headline text-headline-md">
          {result.correct} / {result.total} correct
        </h3>
      </NeoCard>

      {result.results.map((q) => (
        <div key={q.id} className="border-l-2 pl-4 border-secondary">
          {q.text && <p className="font-body text-body-md mb-2">{q.text}</p>}
          <p className="font-label text-label-md uppercase flex items-center gap-2">
            <Icon name="check_circle" className="text-secondary" />
            Correct answer: {q.answer}
          </p>
          {q.explanation && <p className="font-body text-body-md opacity-70 mt-1">{q.explanation}</p>}
        </div>
      ))}
    </div>
  );
}
