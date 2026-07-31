import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import NeoCard from "../components/ui/NeoCard.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import AuthorStats from "../components/market/AuthorStats.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyAuthorStats } from "../lib/api/userStories.js";
import { formatMoney } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

export default function AuthorStudio() {
  const t = useT();
  // GET /user-stories?author_id= ne показывает черновики (жёстко фильтрует status='published'),
  // поэтому список историй автора берётся из /user-stories/my/stats — единственного эндпоинта,
  // который видит все свои истории независимо от статуса.
  const { data, loading, error, reload } = useApi(() => getMyAuthorStats(), []);

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          eyebrow={t("authorStudio.eyebrow")}
          title={t("authorStudio.titleLead")}
          accent={t("authorStudio.titleAccent")}
          subtitle={t("authorStudio.subtitle")}
        />
        <Link to="/studio/new">
          <NeoButton>{t("authorStudio.newStory")}</NeoButton>
        </Link>
      </div>

      {loading && <Skeleton className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-section-gap">
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">{t("authorStudio.stats.stories")}</p>
              <p className="font-display text-3xl">{data.stories.length}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">{t("authorStudio.stats.views")}</p>
              <p className="font-display text-3xl">{data.total_views}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">{t("authorStudio.stats.purchases")}</p>
              <p className="font-display text-3xl">{data.total_purchases}</p>
            </NeoCard>
            <NeoCard variant="accent">
              <p className="font-label text-label-md uppercase text-on-surface-variant">{t("authorStudio.stats.income")}</p>
              <p className="font-display text-3xl">{formatMoney(data.total_income)}</p>
            </NeoCard>
          </div>

          {data.stories.length === 0 ? (
            <EmptyState
              icon="edit_note"
              title={t("authorStudio.emptyTitle")}
              description={t("authorStudio.emptyDescription")}
              action={
                <Link to="/studio/new">
                  <NeoButton>{t("authorStudio.startWriting")}</NeoButton>
                </Link>
              }
            />
          ) : (
            <AuthorStats stories={data.stories} />
          )}
        </>
      )}
    </div>
  );
}
