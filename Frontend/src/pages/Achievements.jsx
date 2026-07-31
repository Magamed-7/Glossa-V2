import PageHeader from "../components/layout/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import AchievementCard from "../components/profile/AchievementCard.jsx";
import { useApi } from "../lib/useApi.js";
import { getAllAchievements, getMyAchievements } from "../lib/api/achievements.js";
import { useT } from "../lib/i18n.jsx";

export default function Achievements() {
  const t = useT();
  const { data, loading, error, reload } = useApi(async () => {
    const [all, mine] = await Promise.all([getAllAchievements(), getMyAchievements()]);
    return { all, mine };
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow={t("achievements.eyebrow")} title={t("achievements.titleLead")} accent={t("achievements.titleAccent")} />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow={t("achievements.eyebrow")} title={t("achievements.titleLead")} accent={t("achievements.titleAccent")} />
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (data.all.length === 0) {
    return (
      <div>
        <PageHeader eyebrow={t("achievements.eyebrow")} title={t("achievements.titleLead")} accent={t("achievements.titleAccent")} />
        <EmptyState
          icon="military_tech"
          title={t("achievements.emptyTitle")}
          description={t("achievements.emptyDescription")}
        />
      </div>
    );
  }

  const earnedByCode = new Map(data.mine.map((a) => [a.code, a]));
  const groups = new Map();
  data.all.forEach((a) => {
    if (!groups.has(a.category)) groups.set(a.category, []);
    groups.get(a.category).push(a);
  });

  return (
    <div>
      <PageHeader eyebrow={t("achievements.eyebrow")} title={t("achievements.titleLead")} accent={t("achievements.titleAccent")} />
      {Array.from(groups.entries()).map(([category, items]) => (
        <div key={category} className="mb-section-gap">
          <h2 className="font-headline text-headline-md mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((a) => (
              <AchievementCard key={a.id} achievement={a} earned={earnedByCode.get(a.code)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
