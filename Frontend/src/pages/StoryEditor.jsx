import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Field from "../components/ui/Field.jsx";
import TextArea from "../components/ui/TextArea.jsx";
import Select from "../components/ui/Select.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { createUserStory } from "../lib/api/userStories.js";
import { errorText } from "../lib/api/errorText.js";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function StoryEditor() {
  const navigate = useNavigate();
  const { languages } = useAuth();
  const targetLevel = languages?.find((l) => l.is_target)?.level;
  // Писать истории может только пользователь с целевым языком уровня B2+
  // (require_writer_level на бэкенде) — проверяем до показа формы, а не после заполнения
  // (см. API_CONTRACT.md §3.7).
  const canWrite = targetLevel && CEFR_ORDER.indexOf(targetLevel) >= CEFR_ORDER.indexOf("B2");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [cefrLevel, setCefrLevel] = useState("B2");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!canWrite) {
    return (
      <div className="max-w-xl mx-auto">
        <EmptyState
          icon="lock"
          title="Upper-Intermediate level required"
          description={`Writing stories requires your target language to be at least B2. Your current level is ${
            targetLevel || "not set"
          }. Keep practicing grammar and reading to level up.`}
        />
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const story = await createUserStory({
        title,
        description: description || undefined,
        body,
        cefr_level: cefrLevel,
        genre: genre || undefined,
        price: price ? Number(price) : undefined,
      });
      navigate(`/studio/${story.id}/edit`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader eyebrow="Author Studio" title="New" accent="Manuscript" />

      <form className="space-y-6" onSubmit={onSubmit}>
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Field
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="CEFR Level" value={cefrLevel} onChange={(e) => setCefrLevel(e.target.value)}>
            {CEFR_ORDER.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          <Field label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <Field
          label="Price (leave empty for free)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextArea
          label="Story Text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="font-ledger"
          required
        />
        <p className="font-label text-label-md text-on-surface-variant">{body.length} characters</p>

        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}

        <NeoButton type="submit" loading={submitting}>
          Save Draft
        </NeoButton>
      </form>
    </div>
  );
}
