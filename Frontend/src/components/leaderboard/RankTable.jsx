import { useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

const PAGE_SIZE = 10;

export default function RankTable({ entries, myUserId, myEntry }) {
  const t = useT();
  const rows = entries.filter((e) => e.rank > 3);
  const myRowIncluded = rows.some((e) => e.user_id === myUserId);

  const [visible, setVisible] = useState(PAGE_SIZE);
  const visibleRows = rows.slice(0, visible);
  const hasMore = visible < rows.length;

  return (
    <section className="border-2 border-black bg-[var(--color-surface)] neo-shadow overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[520px]">
        <caption className="sr-only">{t("leaderboard.captionSr")}</caption>
        <thead>
          <tr className="border-b-2 border-black bg-[var(--color-surface-container-high)]">
            <th
              scope="col"
              className="py-4 px-6 font-label-md text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)] w-16"
            >
              {t("leaderboard.rank")}
            </th>
            <th
              scope="col"
              className="py-4 px-6 font-label-md text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)]"
            >
              {t("leaderboard.scholar")}
            </th>
            <th
              scope="col"
              className="py-4 px-6 font-label-md text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)] text-right"
            >
              {t("leaderboard.score")}
            </th>
          </tr>
        </thead>
        <tbody className="font-body-md text-[var(--color-on-surface)] divide-y divide-[var(--color-surface-variant)]">
          {visibleRows.map((entry, i) => {
            const isMe = entry.user_id === myUserId;
            return (
              <tr
                key={entry.user_id}
                className={`group transition-colors ${
                  isMe
                    ? "bg-crimson-accent/10 border-l-4 border-l-crimson-accent"
                    : i % 2 === 1
                    ? "bg-[var(--color-surface-container-lowest)]"
                    : "hover:bg-[var(--color-surface-variant)]"
                }`}
              >
                <td className="py-4 px-6 font-bold font-headline text-lg text-[var(--color-on-surface)]">
                  {entry.rank}
                </td>
                <td className="py-4 px-6 flex items-center gap-4">
                  <div className="grayscale group-hover:grayscale-0 transition-all">
                    <Avatar
                      photoUrl={entry.photo_url}
                      name={entry.username}
                      userId={entry.user_id}
                      size="sm"
                    />
                  </div>
                  <span className="font-medium text-[var(--color-on-surface)]">
                    {entry.username || t("common.dash")}
                    {isMe && (
                      <span className="ml-2 text-xs font-label-md text-crimson-accent uppercase tracking-widest">
                        ({t("leaderboard.you")})
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-bold text-[var(--color-on-surface)]">
                  {entry.score}
                </td>
              </tr>
            );
          })}

          {/* Sticky "You" row if not in visible set */}
          {myEntry && !myRowIncluded && (
            <tr className="border-t-2 border-black bg-crimson-accent/10 border-l-4 border-l-crimson-accent">
              <td className="py-4 px-6 font-bold font-headline text-lg">
                {myEntry.rank ?? t("common.dash")}
              </td>
              <td className="py-4 px-6 font-medium text-[var(--color-on-surface)]">
                {t("leaderboard.you")}
              </td>
              <td className="py-4 px-6 text-right font-bold">{myEntry.score}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Load more footer */}
      <div className="border-t-2 border-black p-4 flex justify-center bg-[var(--color-surface-container-high)]">
        {hasMore ? (
          <button
            id="leaderboard-load-more"
            className="font-label-md text-sm uppercase tracking-widest text-[var(--color-on-surface)] hover:text-crimson-accent flex items-center gap-2 transition-colors"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            {t("leaderboard.loadMore")}
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        ) : (
          <span className="font-label-md text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)]">
            {t("common.dash")} end {t("common.dash")}
          </span>
        )}
      </div>
    </section>
  );
}
