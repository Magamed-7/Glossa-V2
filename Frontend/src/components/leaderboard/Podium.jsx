import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

const ORDER = [2, 1, 3];

// Height classes for podium columns — percentages expressed as h-* fractions
const PODIUM_HEIGHT = { 1: "flex-[9]", 2: "flex-[7]", 3: "flex-[6]" };
const PODIUM_MIN_H = { 1: "min-h-[180px]", 2: "min-h-[140px]", 3: "min-h-[120px]" };

export default function Podium({ entries }) {
  const t = useT();
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 w-full h-full z-10 pt-4">
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
              {isFirst && (
                <div className="absolute inset-0 rounded-full bg-crimson-accent blur-md opacity-30 pointer-events-none" />
              )}
              <Avatar
                photoUrl={entry.photo_url}
                name={entry.username}
                userId={entry.user_id}
                size={isFirst ? "lg" : "md"}
                className={
                  isFirst
                    ? "border-[3px] border-crimson-accent shadow-[0_0_15px_rgba(220,44,79,0.5)] relative z-10"
                    : "border-2 border-black relative z-10"
                }
              />
              {/* rank badge */}
              <div
                className={`absolute z-20 flex items-center justify-center font-bold text-xs border-2 border-black rounded-full ${
                  isFirst
                    ? "-bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-crimson-accent text-white shadow-[2px_2px_0_0_#000]"
                    : rank === 2
                    ? "-bottom-2 -right-2 w-6 h-6 bg-[var(--color-surface)] text-black"
                    : "-bottom-2 -left-2 w-6 h-6 bg-[var(--color-surface)] text-black"
                }`}
              >
                {rank}
              </div>
            </div>

            {/* username */}
            <span
              className={`font-label-md text-xs md:text-sm text-[var(--color-on-surface)] mb-1 truncate max-w-[80px] md:max-w-[100px] ${
                isFirst ? "font-bold" : ""
              }`}
            >
              {entry.username || t("common.dash")}
            </span>
            {/* score */}
            <span className="font-body-md text-crimson-accent font-bold mb-3 text-sm md:text-base">
              {entry.score}
            </span>

            {/* Podium column */}
            <div
              className={`w-full ${PODIUM_MIN_H[rank]} ${
                isFirst
                  ? "bg-crimson-accent border-2 border-black neo-shadow-crimson"
                  : "bg-[var(--color-surface-variant)] border-2 border-black"
              } flex items-start justify-center pt-3 relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity" />
              <span
                className={`font-headline text-2xl md:text-3xl ${
                  isFirst ? "text-white opacity-90" : "text-[var(--color-on-surface)] opacity-40"
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
