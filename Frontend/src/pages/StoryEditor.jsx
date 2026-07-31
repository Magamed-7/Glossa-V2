import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Field from "../components/ui/Field.jsx";
import TextArea from "../components/ui/TextArea.jsx";
import Select from "../components/ui/Select.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Modal from "../components/ui/Modal.jsx";
import ExerciseBuilder from "../components/market/ExerciseBuilder.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../lib/toast.jsx";
import {
  createUserStory,
  deleteUserStory,
  getUserStory,
  publishUserStory,
  updateUserStory,
  uploadCover,
} from "../lib/api/userStories.js";
import { errorText } from "../lib/api/errorText.js";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function StoryEditor() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();
  const isEditing = !!id;

  const { languages } = useAuth();
  const targetLevel = languages?.find((l) => l.is_target)?.level;
  // Писать истории может только пользователь с целевым языком уровня B2+
  // (require_writer_level на бэкенде) — проверяем до показа формы, а не после заполнения
  // (см. API_CONTRACT.md §3.7). Правка уже существующей истории этой проверке не подлежит.
  const canWrite = isEditing || (targetLevel && CEFR_ORDER.indexOf(targetLevel) >= CEFR_ORDER.indexOf("B2"));

  const { data: existing, loading, error } = useApi(
    () => (isEditing ? getUserStory(id) : Promise.resolve(null)),
    [id]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [cefrLevel, setCefrLevel] = useState("B2");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("draft");
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description || "");
    setBody(existing.body || "");
    setCefrLevel(existing.cefr_level);
    setGenre(existing.genre || "");
    setPrice(existing.price ? String(existing.price) : "");
    setStatus(existing.status);
  }, [existing]);

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

  if (isEditing && loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState error={error} />
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload = {
      title,
      description: description || undefined,
      body,
      cefr_level: cefrLevel,
      genre: genre || undefined,
      price: price ? Number(price) : undefined,
    };

    try {
      if (isEditing) {
        await updateUserStory(id, payload);
        toast.success("Saved");
      } else {
        const story = await createUserStory(payload);
        navigate(`/studio/${story.id}/edit`, { replace: true });
      }
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    try {
      const updated = await publishUserStory(id);
      setStatus(updated.status);
      toast.success("Published to the marketplace");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setPublishing(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteUserStory(id);
      navigate("/studio", { replace: true });
    } catch (err) {
      toast.error(errorText(err));
      setDeleting(false);
    }
  }

  async function onCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      await uploadCover(id, file);
      toast.success("Cover updated");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setUploadingCover(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-start">
        <PageHeader eyebrow="Author Studio" title={isEditing ? "Edit" : "New"} accent="Manuscript" />
        {isEditing && (
          <span className="font-label text-label-md uppercase border-2 border-tertiary px-3 py-1">{status}</span>
        )}
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
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

        {isEditing && (
          <div>
            <label className="block font-label text-label-md uppercase mb-2">Cover Image</label>
            <input type="file" accept="image/*" onChange={onCoverChange} disabled={uploadingCover} />
          </div>
        )}

        <TextArea
          label="Story Text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="font-ledger"
          required
        />
        <p className="font-label text-label-md text-on-surface-variant">{body.length} characters</p>

        {formError && (
          <p role="alert" className="font-label text-label-md text-error">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <NeoButton type="submit" loading={submitting}>
            {isEditing ? "Save Changes" : "Save Draft"}
          </NeoButton>
          {isEditing && status !== "published" && (
            <NeoButton type="button" variant="solid" loading={publishing} onClick={onPublish}>
              Publish
            </NeoButton>
          )}
          {isEditing && (
            <NeoButton type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Delete
            </NeoButton>
          )}
        </div>
      </form>

      {isEditing && <ExerciseBuilder storyId={id} cefrLevel={cefrLevel} />}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Story">
        <p className="font-body text-body-md mb-6">
          This will permanently remove &ldquo;{title}&rdquo;. This can&apos;t be undone.
        </p>
        <div className="flex gap-4">
          <NeoButton variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </NeoButton>
          <NeoButton loading={deleting} onClick={onDelete}>
            Delete
          </NeoButton>
        </div>
      </Modal>
    </div>
  );
}
