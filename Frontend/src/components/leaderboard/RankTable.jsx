import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function RankTable({ entries, myUserId, myEntry }) {
  const t = useT();
  const rows = entries.filter((e) => e.rank > 3);
  const myRowIncluded = rows.some((e) => e.user_id === myUserId);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{t("leaderboard.captionSr")}</caption>
        <thead>
          <tr className="border-b-2 border-tertiary">
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("leaderboard.rank")}</th>
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("leaderboard.learner")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("leaderboard.score")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, i) => (
            <tr
              key={entry.user_id}
              className={`border-b border-surface-container-highest ${
                entry.user_id === myUserId
                  ? "bg-secondary-container text-on-secondary-container"
                  : i % 2 === 1
                  ? "bg-surface-container"
                  : ""
              }`}
            >
              <td className="py-3 font-ledger">{entry.rank}</td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={entry.username} userId={entry.user_id} size="sm" />
                  <span className="font-body">{entry.username || t("common.dash")}</span>
                </div>
              </td>
              <td className="py-3 text-right font-ledger">{entry.score}</td>
            </tr>
          ))}
          {myEntry && !myRowIncluded && (
            <tr className="border-b border-surface-container-highest bg-secondary-container text-on-secondary-container">
              <td className="py-3 font-ledger">{myEntry.rank ?? t("common.dash")}</td>
              <td className="py-3 font-body">{t("leaderboard.you")}</td>
              <td className="py-3 text-right font-ledger">{myEntry.score}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
