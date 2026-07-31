import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function AchievementCard({ achievement, earned }) {
  const t = useT();
  return (
    <div
      className={`border-2 border-tertiary p-4 flex flex-col items-center text-center gap-2 ${
        earned ? "bg-surface" : "opacity-40"
      }`}
    >
      <Icon name={achievement.icon || "military_tech"} className="text-4xl text-secondary" />
      <h3 className="font-headline text-sm">{achievement.title}</h3>
      {achievement.description && (
        <p className="font-body text-xs text-on-surface-variant">{achievement.description}</p>
      )}
      {earned ? (
        <p className="font-label text-label-md text-secondary">
          {t("achievements.earned", { date: new Date(earned.earned_at).toLocaleDateString() })}
        </p>
      ) : (
        <p className="font-label text-label-md text-on-surface-variant">
          {t("achievements.threshold", { n: achievement.threshold })}
        </p>
      )}
    </div>
  );
}
