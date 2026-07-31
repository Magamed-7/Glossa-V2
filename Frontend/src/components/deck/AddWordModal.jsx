import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal.jsx";
import Field from "../ui/Field.jsx";
import TextArea from "../ui/TextArea.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { createCard } from "../../lib/api/deck.js";
import { getMySubscription } from "../../lib/api/subscriptions.js";
import { errorText } from "../../lib/api/errorText.js";

export default function AddWordModal({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [error, setError] = useState(null);
  const [limitPlan, setLimitPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setWord("");
    setTranslation("");
    setExample("");
    setError(null);
    setLimitPlan(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLimitPlan(null);
    setSubmitting(true);

    try {
      const card = await createCard({ word, translation, example: example || undefined });
      reset();
      onCreated(card);
      onClose();
    } catch (err) {
      if (err.code === "LIMIT_REACHED") {
        const { plan } = await getMySubscription();
        setLimitPlan(plan);
      } else {
        setError(errorText(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a Word"
    >
      {limitPlan ? (
        <div className="space-y-4">
          <p className="font-body text-body-md">
            Your <strong>{limitPlan.code}</strong> plan allows {limitPlan.deck_words_per_day ?? "unlimited"} new
            words per day. Come back tomorrow, or upgrade for a higher limit.
          </p>
          <NeoButton onClick={() => navigate("/pricing")}>View Plans</NeoButton>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          <Field label="Word" value={word} onChange={(e) => setWord(e.target.value)} required />
          <Field
            label="Translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
          />
          <TextArea
            label="Example (optional)"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <NeoButton type="submit" className="w-full" loading={submitting}>
            Add to Deck
          </NeoButton>
        </form>
      )}
    </Modal>
  );
}
