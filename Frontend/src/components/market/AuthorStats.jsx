import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/format.js";

export default function AuthorStats({ stories }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-tertiary">
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">Story</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">Views</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">Sales</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">Income</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">Rating</th>
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
                {story.average_rating != null ? story.average_rating.toFixed(1) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
