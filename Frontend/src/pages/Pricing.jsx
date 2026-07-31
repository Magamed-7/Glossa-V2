import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PlanComparison from "../components/pricing/PlanComparison.jsx";
import SubscribeButton from "../components/pricing/SubscribeButton.jsx";
import { useApi } from "../lib/useApi.js";
import { getPlans, getMySubscription } from "../lib/api/subscriptions.js";
import { formatMoney } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

export default function Pricing() {
  const t = useT();
  const { data: plans, loading, error, reload } = useApi(() => getPlans(), []);
  const { data: mySubscription, reload: reloadMySubscription } = useApi(() => getMySubscription(), []);
  const [period, setPeriod] = useState("monthly");

  return (
    <div>
      <PageHeader
        eyebrow={t("pricing.eyebrow")}
        title={t("pricing.titleLead")}
        accent={t("pricing.titleAccent")}
        subtitle={t("pricing.subtitle")}
      />

      <div className="flex justify-center mb-8">
        <div className="inline-flex border-2 border-tertiary">
          <button
            type="button"
            className={`px-4 py-2 font-label text-label-md uppercase ${
              period === "monthly" ? "bg-secondary text-on-secondary" : ""
            }`}
            onClick={() => setPeriod("monthly")}
          >
            {t("pricing.monthly")}
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-label text-label-md uppercase ${
              period === "yearly" ? "bg-secondary text-on-secondary" : ""
            }`}
            onClick={() => setPeriod("yearly")}
          >
            {t("pricing.yearly")}
          </button>
        </div>
      </div>

      {loading && <Skeleton className="h-96" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && plans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = period === "yearly" ? plan.price_yearly : plan.price_monthly;
            const monthlyEquivalent = period === "yearly" ? plan.price_yearly / 12 : plan.price_monthly;
            const savingsPercent =
              plan.price_monthly > 0
                ? Math.round((1 - plan.price_yearly / 12 / plan.price_monthly) * 100)
                : 0;
            const isCurrent = mySubscription?.plan.code === plan.code && mySubscription?.is_active;

            return (
              <div
                key={plan.id}
                className={`border-2 border-tertiary p-8 flex flex-col ${
                  plan.code === "premium" ? "hard-shadow-crimson" : "hard-shadow"
                }`}
              >
                {plan.code === "premium" && (
                  <span className="self-start bg-secondary text-on-secondary font-label text-label-md uppercase px-3 py-1 mb-4">
                    {t("pricing.mostPopular")}
                  </span>
                )}
                <h3 className="font-headline text-headline-md uppercase mb-2">{plan.code}</h3>
                <p className="font-display text-4xl mb-1">
                  {formatMoney(monthlyEquivalent)}
                  <span className="font-label text-label-md">{t("pricing.perMonth")}</span>
                </p>
                {period === "yearly" && plan.price_monthly > 0 && (
                  <p className="font-label text-label-md text-secondary mb-4">
                    {t("pricing.billedYearly", { price: formatMoney(price), percent: savingsPercent })}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <SubscribeButton
                    plan={plan}
                    period={period}
                    isCurrent={isCurrent}
                    onSubscribed={reloadMySubscription}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && plans && <PlanComparison plans={plans} />}
    </div>
  );
}
