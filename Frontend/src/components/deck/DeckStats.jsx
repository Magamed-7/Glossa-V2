import NeoCard from "../ui/NeoCard.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getStats } from "../../lib/api/learning.js";

const METRICS = [
  { key: "cards_total", label: "Total Words" },
  { key: "due_today", label: "Due Today" },
  { key: "learned_count", label: "Learned" },
  { key: "forgotten_count", label: "Forgotten" },
];

export default function DeckStats() {
  const { data, loading } = useApi(() => getStats(), []);

  if (loading) return <Skeleton className="col-span-full h-32" />;
  if (!data) return null;

  return (
    <NeoCard variant="accent" className="col-span-full grid grid-cols-2 md:grid-cols-5 gap-6">
      {METRICS.map((m) => (
        <div key={m.key}>
          <div className="font-ledger text-3xl text-secondary">{data[m.key]}</div>
          <p className="font-label text-label-md uppercase text-on-surface-variant mt-1">{m.label}</p>
        </div>
      ))}
      <div>
        <div className="font-ledger text-3xl text-secondary">{Math.round(data.retention_rate)}%</div>
        <p className="font-label text-label-md uppercase text-on-surface-variant mt-1">Retention</p>
      </div>
    </NeoCard>
  );
}
