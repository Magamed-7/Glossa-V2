import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import { createExercise } from "../../lib/api/userStories.js";
import { generateExercise } from "../../lib/api/ai.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

export default function ExerciseBuilder({ storyId, cefrLevel }) {
  const toast = useToast();
  const [exercises, setExercises] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function onAdd(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const exercise = await createExercise(storyId, {
        type: "short_answer",
        question,
        answer,
        explanation: explanation || undefined,
      });
      setExercises((current) => [...current, exercise]);
      setQuestion("");
      setAnswer("");
      setExplanation("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onGenerate() {
    setGenerating(true);
    try {
      const generated = await generateExercise({ topic: "reading comprehension", level: cefrLevel || "B2" });
      toast.success("Generated — review it below before adding.");
      if (generated?.question) setQuestion(generated.question);
      if (generated?.answer) setAnswer(generated.answer);
      if (generated?.explanation) setExplanation(generated.explanation);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-section-gap">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline text-headline-md">Exercises</h2>
        <NeoButton variant="ghost" size="md" loading={generating} onClick={onGenerate}>
          Generate with AI
        </NeoButton>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-3 mb-6">
          {exercises.map((ex) => (
            <NeoCard key={ex.id} padding="sm">
              <p className="font-body text-body-md">{ex.question}</p>
              <p className="font-label text-label-md text-secondary mt-1">Answer: {ex.answer}</p>
            </NeoCard>
          ))}
        </div>
      )}

      <form className="space-y-4" onSubmit={onAdd}>
        <Field label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        <Field label="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
        <Field
          label="Explanation (optional)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}
        <NeoButton type="submit" variant="ghost" loading={submitting}>
          Add Exercise
        </NeoButton>
      </form>
    </div>
  );
}
