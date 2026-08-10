import { Link } from "react-router-dom";
import Gauge from "../ui/Gauge.jsx";
import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { useApi } from "../../lib/useApi.js";
import { getStats } from "../../lib/api/learning.js";
import { getGrammarPrecision } from "../../lib/api/_pending/grammarPrecision.js";
import { useT } from "../../lib/i18n.jsx";

export default function MetricGauges() {
  const t = useT();
  const { data, loading, error, reload } = useApi(async () => {
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

  if (error) {
    return (
      <div className="col-span-12 md:col-span-6 lg:col-span-5">
        <ErrorState error={error} onRetry={reload} variant="inline" />
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
          <h4 className="font-headline text-2xl">{t("dashboard.metrics.retentionTitle")}</h4>
          {retention === null ? (
            <p className="font-body text-body-md opacity-70">
              <Link to="/deck" className="underline">
                {t("dashboard.metrics.addFirstWord")}
              </Link>{" "}
              {t("dashboard.metrics.toSeeMetric")}
            </p>
          ) : (
            <p className="font-body text-body-md opacity-70">{t("dashboard.metrics.retentionDescription")}</p>
          )}
        </div>
      </NeoCard>

      <NeoCard className="flex items-center gap-8">
        <Gauge value={grammarValue} color="tertiary" />
        <div>
          <h4 className="font-headline text-2xl">{t("dashboard.metrics.grammarTitle")}</h4>
          {grammarValue === null ? (
            <p className="font-body text-body-md opacity-70">
              <Link to="/grammar" className="underline">
                {t("dashboard.metrics.solveFirstLesson")}
              </Link>{" "}
              {t("dashboard.metrics.toSeeMetric")}
            </p>
          ) : (
            <p className="font-body text-body-md opacity-70">
              {t("dashboard.metrics.grammarAccuracy", { n: data.grammar.attempts })}
            </p>
          )}
          <div className="mt-2 text-tertiary font-label text-label-md flex items-center gap-1">
            <Icon name="verified" className="text-sm" /> {t("dashboard.metrics.basedOnHistory")}
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
