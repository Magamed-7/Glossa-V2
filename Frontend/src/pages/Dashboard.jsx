import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import TodayQueueCard from "../components/dashboard/TodayQueueCard.jsx";
import DailyMission from "../components/dashboard/DailyMission.jsx";
import StreakCard from "../components/dashboard/StreakCard.jsx";
import StoryProgressCard from "../components/dashboard/StoryProgressCard.jsx";
import MetricGauges from "../components/dashboard/MetricGauges.jsx";
import Insights from "../components/dashboard/Insights.jsx";
import EmptyDashboard from "../components/dashboard/EmptyDashboard.jsx";
import { useApi } from "../lib/useApi.js";
import { getStats } from "../lib/api/learning.js";
import { getMyProgress } from "../lib/api/stories.js";

export default function Dashboard() {
  const t = useT();
  const { data: overview, loading } = useApi(async () => {
    const [stats, progress] = await Promise.all([getStats(), getMyProgress()]);
    return { stats, progress };
  }, []);

  // Пустой аккаунт: ни одной карточки и ни одной начатой истории — показать приветствие
  // вместо сетки с пустыми/скелетон-блоками. Пока проверка не завершилась, рисуем обычную
  // сетку (её собственные скелетоны уже покрывают состояние загрузки).
  const isEmpty =
    !loading && overview && overview.stats.cards_total === 0 && overview.progress.length === 0;

  if (isEmpty) {
    return <EmptyDashboard />;
  }

  return (
    <div className="relative">
      <DecorativeBackground variant="circles" />

      {/* Dashboard Top Header Bar with Achievements Portal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b-2 border-primary pb-4">
        <div>
          <h1 className="font-headline text-2xl uppercase tracking-tight font-black text-primary">
            {t("nav.home") || "Home"}
          </h1>
        </div>
        <Link
          to="/achievements"
          className="border-2 border-primary bg-secondary text-on-secondary px-4 py-2 font-label text-xs uppercase tracking-widest font-bold shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Icon name="emoji_events" className="text-base" />
          {t("achievements.eyebrow")}
        </Link>
      </div>

      <div className="editorial-grid mb-section-gap">
        <TodayQueueCard />
        <DailyMission />
        <StreakCard />
      </div>
      <div className="editorial-grid">
        <StoryProgressCard />
        <MetricGauges />
      </div>
      <Insights />
    </div>
  );
}
