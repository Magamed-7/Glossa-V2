import { Link } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { useAppData } from "../../lib/AppDataContext.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function StreakCard() {
  const t = useT();
  const { streak, refreshStreak } = useAppData();

  if (streak === undefined) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <Skeleton className="h-full min-h-[220px]" />
      </div>
    );
  }

  if (streak === null) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <ErrorState error={{ message: t("dashboard.streak.error") }} onRetry={refreshStreak} variant="inline" />
      </div>
    );
  }

  const current = streak.current_streak ?? 0;
  const weekProgress = (current % 7) || (current > 0 ? 7 : 0);

  return (
    <div className="col-span-12 lg:col-span-4">
      <NeoCard className="h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-headline text-headline-md leading-none">{t("dashboard.streak.title")}</h3>
            <Icon name="bolt" className="text-secondary" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-display text-6xl text-secondary">{current}</span>
            <span className="font-label text-label-md uppercase opacity-60">{t("dashboard.streak.days")}</span>
          </div>
          <ProgressBar value={weekProgress} max={7} className="mt-6" />
          <p className="font-body text-body-md mt-4 opacity-70 italic">&ldquo;{t("dashboard.streak.quote")}&rdquo;</p>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-tertiary/20 flex items-center justify-between">
          <Link
            to="/achievements"
            className="font-label text-xs uppercase tracking-widest text-secondary hover:underline flex items-center gap-1.5 font-bold"
          >
            <Icon name="military_tech" className="text-lg" />
            {t("dashboard.viewAchievements")}
          </Link>
          <Icon name="arrow_forward" className="text-secondary text-sm" />
        </div>
      </NeoCard>
    </div>
  );
}
