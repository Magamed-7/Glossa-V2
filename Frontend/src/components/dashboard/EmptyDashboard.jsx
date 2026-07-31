import { useNavigate } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";

const STARTERS = [
  {
    icon: "library_books",
    title: "Add your first word",
    description: "Start a personal deck and let spaced repetition do the remembering for you.",
    action: "Open Deck",
    to: "/deck?new=1",
  },
  {
    icon: "auto_stories",
    title: "Open a story",
    description: "Read a leveled story with clickable vocabulary and built-in translations.",
    action: "Browse Stories",
    to: "/stories",
  },
  {
    icon: "menu_book",
    title: "Take a grammar lesson",
    description: "Work through a structured lesson and see exactly where you stand.",
    action: "Open Grammar",
    to: "/grammar",
  },
];

export default function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-section-gap max-w-2xl">
        <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">Welcome</p>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-4 leading-tight">
          Your journey <span className="italic text-secondary">begins here</span>.
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant">
          You haven&apos;t started anything yet — pick one of the paths below to get your first review,
          story, or streak going.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STARTERS.map((s) => (
          <NeoCard key={s.title} className="flex flex-col">
            <Icon name={s.icon} className="text-secondary text-4xl mb-4" />
            <h3 className="font-headline text-headline-md mb-2">{s.title}</h3>
            <p className="font-body text-body-md text-on-surface-variant mb-6 flex-grow">{s.description}</p>
            <NeoButton variant="ghost" onClick={() => navigate(s.to)}>
              {s.action}
            </NeoButton>
          </NeoCard>
        ))}
      </div>
    </div>
  );
}
