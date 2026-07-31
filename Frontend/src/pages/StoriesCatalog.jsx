import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import StoryCard from "../components/stories/StoryCard.jsx";
import CatalogIndex from "../components/stories/CatalogIndex.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyProgress, getStories } from "../lib/api/stories.js";
import { useT } from "../lib/i18n.jsx";

export default function StoriesCatalog() {
  const t = useT();
  const LEVEL_TABS = [
    { value: "", label: t("stories.all") },
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "C1", label: "C1" },
    { value: "C2", label: "C2" },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const level = searchParams.get("level") || "";

  const { data: stories, loading } = useApi(
    () => getStories({ level: level || undefined, limit: 60 }),
    [level]
  );
  // Один запрос на страницу, не по карточке — прогресс не тянется отдельно для каждой истории.
  const { data: progressList } = useApi(() => getMyProgress(), []);
  const progressByStoryId = new Map((progressList || []).map((p) => [p.story_id, p]));

  function onLevelChange(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("level", value);
    else next.delete("level");
    setSearchParams(next);
  }

  const featured = stories?.slice(0, 3) || [];
  const rest = stories?.slice(3) || [];

  return (
    <div>
      <PageHeader
        eyebrow={t("stories.eyebrow")}
        title={t("stories.titleLead")}
        accent={t("stories.titleAccent")}
        subtitle={t("stories.subtitle")}
      />

      <div className="mb-8">
        <Tabs id="story-level" tabs={LEVEL_TABS} value={level} onChange={onLevelChange} />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      )}

      {!loading && level === "C2" && stories?.length === 0 && (
        <EmptyState icon="auto_stories" title={t("stories.c2ComingTitle")} description={t("stories.c2ComingDescription")} />
      )}

      {!loading && level !== "C2" && stories?.length === 0 && (
        <EmptyState icon="auto_stories" title={t("stories.emptyLevelTitle")} />
      )}

      {!loading && stories?.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((story) => (
              <StoryCard key={story.id} story={story} progress={progressByStoryId.get(story.id)} />
            ))}
          </div>
          <CatalogIndex stories={rest} />
        </>
      )}
    </div>
  );
}
