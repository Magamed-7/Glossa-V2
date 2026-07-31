import NeoCard from "../ui/NeoCard.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getStats } from "../../lib/api/learning.js";
import { useT } from "../../lib/i18n.jsx";

const METRICS = [
  { key: "cards_total", labelKey: "deck.stats.total" },
  { key: "due_today", labelKey: "deck.stats.due" },
  { key: "learned_count", labelKey: "deck.stats.learned" },
  { key: "forgotten_count", labelKey: "deck.stats.forgotten" },
];

export default function DeckStats() {
  const t = useT();
  const { data, loading } = useApi(() => getStats(), []);

  if (loading) return <Skeleton className="col-span-full h-32" />;
  if (!data) return null;

  return (
    <NeoCard variant="accent" className="col-span-full grid grid-cols-2 md:grid-cols-5 gap-6">
      {METRICS.map((m) => (
        <div key={m.key}>
          <div className="font-ledger text-3xl text-secondary">{data[m.key]}</div>
          <p className="font-label text-label-md uppercase text-on-surface-variant mt-1">{t(m.labelKey)}</p>
        </div>
      ))}
      <div>
        <div className="font-ledger text-3xl text-secondary">{Math.round(data.retention_rate)}%</div>
        <p className="font-label text-label-md uppercase text-on-surface-variant mt-1">{t("deck.stats.retention")}</p>
      </div>
    </NeoCard>
  );
}
