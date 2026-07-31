import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import Icon from "../components/ui/Icon.jsx";
import BuyButton from "../components/market/BuyButton.jsx";
import Reviews from "../components/market/Reviews.jsx";
import { useApi } from "../lib/useApi.js";
import { getUserStory } from "../lib/api/userStories.js";
import { resolveUser } from "../lib/api/_pending/userLookup.js";
import { readUserId } from "../lib/auth/tokens.js";
import { formatMoney } from "../lib/format.js";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

export default function MarketplaceStory() {
  const { id } = useParams();
  const { data: story, loading, error, reload } = useApi(() => getUserStory(id), [id]);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    if (story) resolveUser(story.author_id).then(setAuthor);
  }, [story]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const cover = story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length];
  const owned = story.body !== null && story.body !== undefined;
  const isMine = Number(readUserId()) === story.author_id;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="aspect-[16/9] w-full overflow-hidden border-2 border-tertiary mb-8">
        <img className="w-full h-full object-cover" src={cover} alt="" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Badge level={story.cefr_level} />
        {story.genre && <span className="font-label text-label-md text-on-surface-variant uppercase">{story.genre}</span>}
        {story.average_rating != null && (
          <span className="font-label text-label-md flex items-center gap-1">
            <Icon name="star" filled className="text-secondary text-sm" />
            {story.average_rating.toFixed(1)}
          </span>
        )}
      </div>

      <h1 className="font-display text-headline-lg mb-2">{story.title}</h1>
      <p className="font-body text-body-md text-on-surface-variant mb-8">
        by {author?.username || "…"} · {story.views_count} views
      </p>

      {story.description && <p className="font-body text-body-lg mb-8">{story.description}</p>}

      {/* body === null у некупленной платной истории — это витрина, не ошибка (API_CONTRACT.md §3.7). */}
      {!owned && (
        <div className="relative border-2 border-tertiary p-8 md:p-12 overflow-hidden mb-8">
          <span className="absolute top-6 right-[-40px] rotate-12 bg-tertiary text-surface font-label text-label-md uppercase tracking-widest px-10 py-2">
            Locked
          </span>
          <div className="flex items-center gap-3 mb-4">
            <Icon name="lock" className="text-tertiary text-2xl" />
            <p className="font-headline text-headline-md">Available after purchase</p>
          </div>
          <p className="font-body text-body-md text-on-surface-variant mb-6">
            Buy this story for {story.price ? formatMoney(story.price) : "free"} to read the full text and
            take its exercises.
          </p>
          {!isMine && <BuyButton story={story} onPurchased={reload} />}
        </div>
      )}

      {owned && story.body && (
        <div className="font-body text-body-lg leading-relaxed whitespace-pre-line mb-8">{story.body}</div>
      )}

      <Reviews storyId={story.id} canReview={owned && !isMine} />
    </div>
  );
}
