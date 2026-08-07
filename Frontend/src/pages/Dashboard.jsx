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
