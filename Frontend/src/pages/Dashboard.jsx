import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import DailyMission from "../components/dashboard/DailyMission.jsx";
import StreakCard from "../components/dashboard/StreakCard.jsx";
import StoryProgressCard from "../components/dashboard/StoryProgressCard.jsx";

export default function Dashboard() {
  return (
    <div className="relative">
      <DecorativeBackground variant="circles" />
      <div className="editorial-grid mb-section-gap">
        <DailyMission />
        <StreakCard />
      </div>
      <div className="editorial-grid">
        <StoryProgressCard />
      </div>
    </div>
  );
}
