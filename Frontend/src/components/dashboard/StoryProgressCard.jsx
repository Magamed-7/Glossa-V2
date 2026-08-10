import { useNavigate } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getMyProgress, getStories } from "../../lib/api/stories.js";
import { useT } from "../../lib/i18n.jsx";

export default function StoryProgressCard() {
  const t = useT();
  const navigate = useNavigate();

  // Как и в DailyMission: GET /stories/{id} расходует дневной лимит, поэтому история ищется
  // в уже загруженном списке GET /stories/, а не открывается напрямую.
  const { data, loading, error, reload } = useApi(async () => {
    const progress = await getMyProgress();
    const unfinished = progress.find((p) => !p.is_completed);
    if (!unfinished) return null;

    const stories = await getStories({ limit: 100 });
    const story = stories.find((s) => s.id === unfinished.story_id);
    return story || null;
  }, []);

  if (loading) {
    return (
      <div className="col-span-12 md:col-span-6 lg:col-span-7">
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-12 md:col-span-6 lg:col-span-7">
        <ErrorState error={error} onRetry={reload} variant="inline" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="col-span-12 md:col-span-6 lg:col-span-7">
        <EmptyState
          icon="auto_stories"
          title={t("dashboard.story.emptyTitle")}
          description={t("dashboard.story.emptyDescription")}
          action={
            <NeoButton variant="ghost" onClick={() => navigate("/stories")}>
              {t("dashboard.story.browse")}
            </NeoButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-7">
      <NeoCard variant="accent" className="h-[420px] relative overflow-hidden group !p-0">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center grayscale contrast-125 opacity-40 transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url('${data.image_url || "/img/textures/vintage-map.webp"}')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10" />
        <div className="relative z-20 p-8 h-full flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-secondary text-on-secondary px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
              {t("dashboard.story.ongoing")}
            </span>
          </div>
          <h3 className="font-headline text-headline-lg mb-2">{data.title}</h3>
          {data.genre && <p className="font-body text-body-md max-w-md mb-6">{data.genre}</p>}
          <div className="flex gap-4">
            <NeoButton variant="solid" onClick={() => navigate(`/stories/${data.id}`)}>
              {t("dashboard.story.continue")}
            </NeoButton>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
