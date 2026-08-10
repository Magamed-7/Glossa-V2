import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

const ORDER = [2, 1, 3];

export default function Podium({ entries }) {
  const t = useT();
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 w-full z-10 pt-4">
      {ORDER.map((rank) => {
        const entry = byRank.get(rank);
        if (!entry) return null;

        const isFirst = rank === 1;

        return (
          <div
            key={rank}
            className="flex flex-col items-center group cursor-pointer"
            style={{ flex: rank === 1 ? 9 : rank === 2 ? 7 : 6, minHeight: 0 }}
          >
            {/* Avatar */}
            <div className="relative mb-3 transform group-hover:-translate-y-2 transition-transform duration-200">
              <Avatar
                photoUrl={entry.photo_url}
                name={entry.username}
                userId={entry.user_id}
                size={isFirst ? "lg" : "md"}
                className={
                  isFirst
                    ? "border-[3px] border-secondary-container relative z-10"
                    : "border-2 border-tertiary relative z-10"
                }
              />
              {/* rank badge */}
              <div
                className={`absolute z-20 flex items-center justify-center font-bold text-xs border-2 border-tertiary rounded-full ${
                  isFirst
                    ? "-bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-secondary-container text-on-secondary-container hard-shadow"
                    : rank === 2
                    ? "-bottom-2 -right-2 w-6 h-6 bg-surface text-on-surface"
                    : "-bottom-2 -left-2 w-6 h-6 bg-surface text-on-surface"
                }`}
              >
                {rank}
              </div>
            </div>

            {/* username */}
            <span
              className={`font-label text-xs md:text-sm text-on-surface mb-1 truncate max-w-[80px] md:max-w-[100px] ${
                isFirst ? "font-bold" : ""
              }`}
            >
              {entry.username || t("common.dash")}
            </span>
            {/* score */}
            <span className="font-body text-secondary font-bold mb-3 text-sm md:text-base">
              {entry.score}
            </span>

            {/* Podium column */}
            <div
              className={`w-full ${
                isFirst
                  ? "min-h-[180px] bg-secondary-container border-2 border-tertiary hard-shadow-crimson"
                  : rank === 2
                  ? "min-h-[140px] bg-surface-variant border-2 border-tertiary"
                  : "min-h-[110px] bg-surface-variant border-2 border-tertiary"
              } flex items-start justify-center pt-3 relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-tertiary opacity-0 group-hover:opacity-5 transition-opacity" />
              <span
                className={`font-headline text-2xl md:text-3xl ${
                  isFirst ? "text-on-secondary-container opacity-90" : "text-on-surface opacity-40"
                }`}
              >
                {rank === 1 ? "I" : rank === 2 ? "II" : "III"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
