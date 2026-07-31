import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import DailyMission from "../components/dashboard/DailyMission.jsx";

export default function Dashboard() {
  return (
    <div className="relative">
      <DecorativeBackground variant="circles" />
      <div className="editorial-grid mb-section-gap">
        <DailyMission />
      </div>
      <div className="editorial-grid">{/* Metrics go here */}</div>
    </div>
  );
}
