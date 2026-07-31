import { useEffect, useState } from "react";
import Icon from "../ui/Icon.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import TextArea from "../ui/TextArea.jsx";
import { createReview, getReviews } from "../../lib/api/userStories.js";
import { resolveUser } from "../../lib/api/_pending/userLookup.js";
import { errorText } from "../../lib/api/errorText.js";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange} aria-label={`${n} stars`}>
          <Icon name="star" filled={n <= value} className={n <= value ? "text-secondary" : "text-outline-variant"} />
        </button>
      ))}
    </div>
  );
}

function ReviewRow({ review }) {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    resolveUser(review.user_id).then(setAuthor);
  }, [review.user_id]);

  return (
    <div className="border-t-2 border-surface-container-highest pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-headline text-lg">{author?.username || "…"}</span>
        <Stars value={review.rating} />
      </div>
      {review.text && <p className="font-body text-body-md text-on-surface-variant">{review.text}</p>}
    </div>
  );
}

export default function Reviews({ storyId, canReview }) {
  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getReviews(storyId).then(setReviews);
  }, [storyId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const review = await createReview(storyId, { rating, text: text || undefined });
      setReviews((current) => [review, ...(current || [])]);
      setText("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-section-gap">
      <h2 className="font-headline text-headline-md mb-6">Reviews</h2>

      {canReview && (
        <form className="mb-8 space-y-4" onSubmit={onSubmit}>
          <Stars value={rating} onChange={setRating} />
          <TextArea label="Your review (optional)" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <NeoButton type="submit" loading={submitting}>
            Submit Review
          </NeoButton>
        </form>
      )}

      {reviews === null ? null : reviews.length === 0 ? (
        <p className="font-body text-body-md opacity-70">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
