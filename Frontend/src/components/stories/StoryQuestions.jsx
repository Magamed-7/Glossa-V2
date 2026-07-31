import { useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";
import NeoCard from "../ui/NeoCard.jsx";
import { submitQuestions } from "../../lib/api/stories.js";
import { errorText } from "../../lib/api/errorText.js";
import { useT } from "../../lib/i18n.jsx";

export default function StoryQuestions({ storyId, questions, onCompleted }) {
  const t = useT();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (questions.length === 0) return null;

  function setAnswer(questionId, value) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || "" }));
      const outcome = await submitQuestions(storyId, payload);
      setResult(outcome);
      if (outcome.completed) onCompleted?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <NeoCard variant="accent" className="mt-10">
        <h3 className="font-headline text-headline-md mb-2">
          {t("grammar.scoreOf", { correct: result.correct, total: result.total })}
        </h3>
        {result.completed && (
          <p className="font-body text-body-md text-secondary">{t("stories.markedReadToast")}</p>
        )}
      </NeoCard>
    );
  }

  return (
    <form className="mt-10 pt-6 border-t-2 border-tertiary space-y-6" onSubmit={onSubmit}>
      <h3 className="font-headline text-headline-md">{t("stories.comprehensionCheck")}</h3>
      {questions.map((q) => (
        <div key={q.id}>
          <p className="font-body text-body-md mb-3">{q.text}</p>
          {q.options ? (
            <div className="flex flex-col gap-2">
              {q.options.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => setAnswer(q.id, option)}
                  />
                  <span className="font-body text-body-md">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              className="w-full bg-surface-container-low border-2 border-tertiary px-4 py-3 font-body text-body-md outline-none focus:border-secondary"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="font-label text-label-md text-error">
          {error}
        </p>
      )}
      <NeoButton type="submit" loading={submitting}>
        {t("stories.submitAnswers")}
      </NeoButton>
    </form>
  );
}
