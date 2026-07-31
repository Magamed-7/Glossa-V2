import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function AuthorStats({ stories }) {
  const t = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-tertiary">
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("market.authorStats.story")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("market.authorStats.views")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("market.authorStats.sales")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("market.authorStats.income")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("market.authorStats.rating")}</th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story, i) => (
            <tr
              key={story.story_id}
              className={`border-b border-surface-container-highest ${i % 2 === 1 ? "bg-surface-container" : ""}`}
            >
              <td className="py-3">
                <Link to={`/studio/${story.story_id}/edit`} className="font-headline hover:underline">
                  {story.title}
                </Link>
              </td>
              <td className="py-3 text-right font-ledger">{story.views_count}</td>
              <td className="py-3 text-right font-ledger">{story.purchases_count}</td>
              <td className="py-3 text-right font-ledger">{formatMoney(story.income)}</td>
              <td className="py-3 text-right font-ledger">
                {story.average_rating != null ? story.average_rating.toFixed(1) : t("common.dash")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
