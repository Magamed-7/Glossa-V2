import NeoCard from "../ui/NeoCard.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getWeakTopics } from "../../lib/api/grammar.js";
import { useT } from "../../lib/i18n.jsx";

export default function WeakTopics() {
  const t = useT();
  const { data: topics, loading } = useApi(() => getWeakTopics(), []);

  if (loading) return <Skeleton className="h-40" />;

  if (!topics || topics.length === 0) {
    return <EmptyState icon="verified" title={t("grammar.weakEmptyTitle")} description={t("grammar.weakEmptyDescription")} />;
  }

  const worst = [...topics].sort((a, b) => b.error_rate - a.error_rate).slice(0, 5);

  return (
    <NeoCard variant="accent">
      <h3 className="font-headline text-headline-md mb-4">{t("grammar.criticalRevisions")}</h3>
      <ul className="space-y-3">
        {worst.map((topic) => (
          <li key={topic.topic} className="flex justify-between items-center">
            <span className="font-body text-body-md">{topic.topic}</span>
            {/* error_rate уже приходит процентом 0..100 (crud_content.py), не долей 0..1 */}
            <span className="font-ledger text-sm text-secondary">{Math.round(topic.error_rate)}%</span>
          </li>
        ))}
      </ul>
    </NeoCard>
  );
}
