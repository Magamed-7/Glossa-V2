import { useNavigate } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const STARTERS = [
  { icon: "library_books", key: "word", to: "/deck?new=1" },
  { icon: "auto_stories", key: "story", to: "/stories" },
  { icon: "menu_book", key: "grammar", to: "/grammar" },
];

export default function EmptyDashboard() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-section-gap max-w-2xl">
        <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">{t("dashboard.empty.eyebrow")}</p>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-4 leading-tight">
          {t("dashboard.empty.titleLead")}
          <span className="italic text-secondary">{t("dashboard.empty.titleAccent")}</span>.
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant">{t("dashboard.empty.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STARTERS.map((s) => (
          <NeoCard key={s.key} className="flex flex-col">
            <Icon name={s.icon} className="text-secondary text-4xl mb-4" />
            <h3 className="font-headline text-headline-md mb-2">{t(`dashboard.empty.${s.key}.title`)}</h3>
            <p className="font-body text-body-md text-on-surface-variant mb-6 flex-grow">
              {t(`dashboard.empty.${s.key}.description`)}
            </p>
            <NeoButton variant="ghost" onClick={() => navigate(s.to)}>
              {t(`dashboard.empty.${s.key}.action`)}
            </NeoButton>
          </NeoCard>
        ))}
      </div>
    </div>
  );
}
