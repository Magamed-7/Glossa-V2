import Avatar from "../ui/Avatar.jsx";

const HEIGHTS = { 1: "h-40", 2: "h-28", 3: "h-20" };
const ORDER = [2, 1, 3];

export default function Podium({ entries }) {
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <div className="flex items-end justify-center gap-6 mb-section-gap">
      {ORDER.map((rank) => {
        const entry = byRank.get(rank);
        if (!entry) return null;

        return (
          <div key={rank} className="flex flex-col items-center gap-3 w-32">
            <Avatar name={entry.username} userId={entry.user_id} size={rank === 1 ? "lg" : "md"} />
            <span className="font-headline text-lg text-center truncate w-full">{entry.username || "—"}</span>
            <span className="font-ledger text-secondary">{entry.score}</span>
            <div className={`w-full ${HEIGHTS[rank]} bg-secondary-container border-2 border-tertiary flex items-start justify-center pt-2`}>
              <span className="font-display text-3xl">{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
