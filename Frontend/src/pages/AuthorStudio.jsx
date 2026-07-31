import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import NeoCard from "../components/ui/NeoCard.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyAuthorStats } from "../lib/api/userStories.js";
import { formatMoney } from "../lib/format.js";

export default function AuthorStudio() {
  // GET /user-stories?author_id= ne показывает черновики (жёстко фильтрует status='published'),
  // поэтому список историй автора берётся из /user-stories/my/stats — единственного эндпоинта,
  // который видит все свои истории независимо от статуса.
  const { data, loading, error, reload } = useApi(() => getMyAuthorStats(), []);

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          eyebrow="Author Studio"
          title="Your"
          accent="Manuscripts"
          subtitle="Everything you've written, published or still in draft."
        />
        <Link to="/studio/new">
          <NeoButton>New Story</NeoButton>
        </Link>
      </div>

      {loading && <Skeleton className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-section-gap">
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">Stories</p>
              <p className="font-display text-3xl">{data.stories.length}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">Views</p>
              <p className="font-display text-3xl">{data.total_views}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">Purchases</p>
              <p className="font-display text-3xl">{data.total_purchases}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">Income</p>
              <p className="font-display text-3xl">{formatMoney(data.total_income)}</p>
            </NeoCard>
          </div>

          {data.stories.length === 0 ? (
            <EmptyState
              icon="edit_note"
              title="No stories yet"
              description="Write your first story and share it with the community."
              action={
                <Link to="/studio/new">
                  <NeoButton>Start Writing</NeoButton>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.stories.map((story) => (
                <Link
                  key={story.story_id}
                  to={`/studio/${story.story_id}/edit`}
                  className="flex items-center justify-between p-4 border-2 border-tertiary hover:-translate-y-1 hard-shadow transition-all bg-surface"
                >
                  <span className="font-headline text-lg">{story.title}</span>
                  <span className="font-ledger text-sm text-secondary">
                    {story.views_count} views · {story.purchases_count} sales
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
