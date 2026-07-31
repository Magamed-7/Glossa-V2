import { Link } from "react-router-dom";
import Gauge from "../ui/Gauge.jsx";
import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getStats } from "../../lib/api/learning.js";
import { getGrammarPrecision } from "../../lib/api/_pending/grammarPrecision.js";

export default function MetricGauges() {
  const { data, loading } = useApi(async () => {
    const [stats, grammar] = await Promise.all([getStats(), getGrammarPrecision()]);
    return { stats, grammar };
  }, []);

  if (loading) {
    return (
      <div className="col-span-12 md:col-span-6 lg:col-span-5 grid grid-cols-1 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  // retention_rate уже приходит процентом 0..100 (crud_card.py: remembered / total * 100),
  // не долей 0..1 — умножать на 100 не нужно. cards_total === 0 означает "нет карточек", а не 0%.
  const retention = data && data.stats.cards_total > 0 ? Math.round(data.stats.retention_rate) : null;
  const grammarValue = data?.grammar.value ?? null;

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-5 grid grid-cols-1 gap-6">
      <NeoCard className="flex items-center gap-8">
        <Gauge value={retention} color="secondary" />
        <div>
          <h4 className="font-headline text-2xl">Synaptic Retention</h4>
          {retention === null ? (
            <p className="font-body text-body-md opacity-70">
              <Link to="/deck" className="underline">
                Add your first word
              </Link>{" "}
              to see this metric.
            </p>
          ) : (
            <p className="font-body text-body-md opacity-70">
              Long-term memory stability for core vocabulary sets.
            </p>
          )}
        </div>
      </NeoCard>

      <NeoCard className="flex items-center gap-8">
        <Gauge value={grammarValue} color="tertiary" />
        <div>
          <h4 className="font-headline text-2xl">Grammar Precision</h4>
          {grammarValue === null ? (
            <p className="font-body text-body-md opacity-70">
              <Link to="/grammar" className="underline">
                Solve your first lesson
              </Link>{" "}
              to see this metric.
            </p>
          ) : (
            <p className="font-body text-body-md opacity-70">
              Accuracy across {data.grammar.attempts} grammar attempts.
            </p>
          )}
          <div className="mt-2 text-tertiary font-label text-label-md flex items-center gap-1">
            <Icon name="verified" className="text-sm" /> Based on your review history
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
