import PageHeader from "../components/layout/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getAllAchievements, getMyAchievements } from "../lib/api/achievements.js";

export default function Achievements() {
  const { data, loading, error, reload } = useApi(async () => {
    const [all, mine] = await Promise.all([getAllAchievements(), getMyAchievements()]);
    return { all, mine };
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Milestones" title="Your" accent="Achievements" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Milestones" title="Your" accent="Achievements" />
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (data.all.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Milestones" title="Your" accent="Achievements" />
        <EmptyState
          icon="military_tech"
          title="No achievements available yet"
          description="Achievement templates haven't been set up for this environment yet."
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
      <PageHeader eyebrow="Milestones" title="Your" accent="Achievements" />
      {Array.from(groups.entries()).map(([category, items]) => (
        <div key={category} className="mb-section-gap">
          <h2 className="font-headline text-headline-md mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((a) => {
              const earned = earnedByCode.get(a.code);
              return (
                <div
                  key={a.id}
                  className={`border-2 border-tertiary p-4 flex flex-col items-center text-center gap-2 ${
                    earned ? "bg-surface" : "opacity-40"
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl text-secondary">
                    {a.icon || "military_tech"}
                  </span>
                  <h3 className="font-headline text-sm">{a.title}</h3>
                  {a.description && (
                    <p className="font-body text-xs text-on-surface-variant">{a.description}</p>
                  )}
                  {!earned && (
                    <p className="font-label text-label-md text-on-surface-variant">Threshold: {a.threshold}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
