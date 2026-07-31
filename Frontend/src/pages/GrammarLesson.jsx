import { useParams } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useApi } from "../lib/useApi.js";
import { getLesson } from "../lib/api/grammar.js";

export default function GrammarLesson() {
  const { id } = useParams();
  const { data: lesson, loading, error, reload } = useApi(() => getLesson(id), [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-1/2 mb-6" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const examples = [...lesson.examples].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Badge level={lesson.cefr_level} />
        {lesson.unit && <span className="font-label text-label-md text-on-surface-variant uppercase">{lesson.unit}</span>}
      </div>
      <h1 className="font-display text-headline-lg mb-2">{lesson.topic}</h1>
      {lesson.structure && <p className="font-ledger text-lg text-secondary mb-8">{lesson.structure}</p>}

      {lesson.rule && (
        <div className="neo-card p-6 mb-8">
          <h2 className="font-headline text-headline-md mb-3">Rule</h2>
          <p className="font-body text-body-lg">{lesson.rule}</p>
        </div>
      )}

      {examples.length > 0 && (
        <div className="mb-8">
          <h2 className="font-headline text-headline-md mb-4">Examples</h2>
          <ul className="space-y-3 border-t-2 border-tertiary pt-4">
            {examples.map((ex) => (
              <li key={ex.id} className="font-body text-body-lg pl-4 border-l-2 border-secondary">
                {ex.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.tip && (
        <div className="bg-secondary-container text-on-secondary-container p-6 border-2 border-tertiary italic font-body text-body-md">
          {lesson.tip}
        </div>
      )}

      <div>{/* Question form goes here */}</div>
    </div>
  );
}
