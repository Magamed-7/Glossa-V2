import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Icon from "../ui/Icon.jsx";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useAppData } from "../../lib/AppDataContext.jsx";
import { getMyProgress, getStories } from "../../lib/api/stories.js";
import { getLessons } from "../../lib/api/grammar.js";
import { useT } from "../../lib/i18n.jsx";

export default function DailyMission() {
  const t = useT();
  const { languages } = useAuth();
  const { streak } = useAppData();
  const navigate = useNavigate();
  const targetLevel = languages?.find((l) => l.is_target)?.level || "A1";

  const { data, loading, error, reload } = useApi(async () => {
    // GET /stories/{id} расходует дневной лимит — искать незавершённую историю в уже
    // загруженном списке GET /stories/, не открывая её напрямую (см. API_CONTRACT.md §3.3).
    const progress = await getMyProgress();
    const unfinished = progress.find((p) => !p.is_completed);

    if (unfinished) {
      const stories = await getStories({ level: targetLevel, limit: 100 });
      const story = stories.find((s) => s.id === unfinished.story_id);
      if (story) return { type: "story", story };
    }

    const lessons = await getLessons({ level: targetLevel, limit: 1 });
    if (lessons[0]) return { type: "grammar", lesson: lessons[0] };

    return null;
  }, [targetLevel]);

  if (loading) {
    return <Skeleton className="col-span-12 lg:col-span-8 h-64" />;
  }

  if (error) {
    return (
      <div className="col-span-12 lg:col-span-8">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (!data) return null;

  const missionNumber = streak?.current_streak || 1;

  return (
    <div className="col-span-12 lg:col-span-8 bg-secondary-container border-2 border-tertiary p-8 md:p-12 shadow-[8px_8px_0px_0px_var(--color-tertiary)] flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
      <div className="relative z-10 space-y-6">
        <span className="bg-tertiary text-surface font-label text-label-md px-3 py-1 uppercase tracking-widest">
          {t("dashboard.mission", { n: String(missionNumber).padStart(3, "0") })}
        </span>
        <h2 className="font-display text-display-lg-mobile md:text-display-lg text-on-secondary-container leading-tight">
          {data.type === "story" ? data.story.title : data.lesson.topic}
        </h2>
        <p className="font-body text-body-lg text-on-secondary-container/90 max-w-md">
          {data.type === "story" ? data.story.genre : data.lesson.tip}
        </p>
        <NeoButton
          variant="inverse"
          onClick={() =>
            navigate(data.type === "story" ? `/stories/${data.story.id}` : `/grammar/${data.lesson.id}`)
          }
        >
          {data.type === "story" ? t("dashboard.continueReading") : t("dashboard.resumeLesson")}
        </NeoButton>
      </div>
      <div className="w-full md:w-1/3 aspect-square relative z-10 flex items-center justify-center">
        <div className="w-full h-full border-4 border-surface/30 rotate-12 flex items-center justify-center">
          <div className="w-3/4 h-3/4 border-4 border-surface/60 -rotate-12 flex items-center justify-center">
            <Icon name="auto_stories" filled className="text-surface text-7xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
