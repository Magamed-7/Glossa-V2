import { useState } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import QuestionForm from "../components/grammar/QuestionForm.jsx";
import LessonResults from "../components/grammar/LessonResults.jsx";
import { useApi } from "../lib/useApi.js";
import { useAppData } from "../lib/AppDataContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getLesson, submitLesson } from "../lib/api/grammar.js";
import { useT } from "../lib/i18n.jsx";

export default function GrammarLesson() {
  const t = useT();
  const { id } = useParams();
  const { refreshStreak } = useAppData();
  const { data: lesson, loading, error, reload } = useApi(() => getLesson(id), [id]);

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  function setAnswer(questionId, value) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const payload = lesson.questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || "" }));
      const outcome = await submitLesson(lesson.id, payload);
      setResult(outcome);
      refreshStreak();
    } catch (err) {
      setSubmitError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

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
          <h2 className="font-headline text-headline-md mb-3">{t("grammar.rule")}</h2>
          <p className="font-body text-body-lg">{lesson.rule}</p>
        </div>
      )}

      {examples.length > 0 && (
        <div className="mb-8">
          <h2 className="font-headline text-headline-md mb-4">{t("grammar.examples")}</h2>
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
        <div className="bg-secondary-container text-on-secondary-container p-6 border-2 border-tertiary italic font-body text-body-md mb-8">
          {lesson.tip}
        </div>
      )}

      {result ? (
        <LessonResults result={result} />
      ) : (
        lesson.questions.length > 0 && (
          <form className="pt-6 border-t-2 border-tertiary space-y-6" onSubmit={onSubmit}>
            <h2 className="font-headline text-headline-md">{t("grammar.practice")}</h2>
            <QuestionForm questions={lesson.questions} answers={answers} onChange={setAnswer} />
            {submitError && (
              <p role="alert" className="font-label text-label-md text-error">
                {submitError}
              </p>
            )}
            <NeoButton type="submit" loading={submitting}>
              {t("grammar.submitAnswers")}
            </NeoButton>
          </form>
        )
      )}
    </div>
  );
}
