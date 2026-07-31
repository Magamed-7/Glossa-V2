import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";

export default function Dashboard() {
  return (
    <div className="relative">
      <DecorativeBackground variant="circles" />
      <div className="editorial-grid mb-section-gap">{/* Daily mission + streak go here */}</div>
      <div className="editorial-grid">{/* Metrics go here */}</div>
    </div>
  );
}
