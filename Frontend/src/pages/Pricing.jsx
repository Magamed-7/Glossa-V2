import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
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

  const includedItems = t("pricing.includedItems");

  return (
    <div>
      <PageHeader
        eyebrow={t("pricing.eyebrow")}
        title={t("pricing.titleLead")}
        accent={t("pricing.titleAccent")}
        subtitle={t("pricing.subtitle")}
      />

      {Array.isArray(includedItems) && includedItems.length > 0 && (
        <div className="border-2 border-tertiary bg-surface-container-low p-6 mb-10">
          <h2 className="font-label text-label-md uppercase tracking-widest text-on-surface-variant mb-4">
            {t("pricing.includedTitle")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {includedItems.map((item) => (
              <li key={item} className="flex items-start gap-2 font-body text-body-md">
                <Icon name="check_circle" className="text-secondary text-lg shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="inline-flex border-2 border-tertiary">
          {["monthly", "half_yearly", "yearly"].map((value) => (
            <button
              key={value}
              type="button"
              className={`px-4 py-2 font-label text-label-md uppercase ${
                period === value ? "bg-secondary text-on-secondary" : ""
              }`}
              onClick={() => setPeriod(value)}
            >
              {t(`pricing.${value === "half_yearly" ? "halfYearly" : value}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && <Skeleton className="h-96" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && plans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const periodMonths = { monthly: 1, half_yearly: 6, yearly: 12 }[period];
            const price = { monthly: plan.price_monthly, half_yearly: plan.price_half_yearly, yearly: plan.price_yearly }[period];
            const monthlyEquivalent = price / periodMonths;
            const savingsPercent =
              plan.price_monthly > 0
                ? Math.round((1 - monthlyEquivalent / plan.price_monthly) * 100)
                : 0;
            const isCurrent = mySubscription?.plan.code === plan.code && mySubscription?.is_active;
            const features = t(`pricing.plans.${plan.code}.features`);
            const locked = t(`pricing.plans.${plan.code}.locked`);

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
                <h3 className="font-headline text-headline-md uppercase mb-1">
                  {t(`pricing.plans.${plan.code}.name`) || plan.code}
                </h3>
                <p className="font-body text-sm text-on-surface-variant mb-4 min-h-[2.5em]">
                  {t(`pricing.plans.${plan.code}.tagline`)}
                </p>
                <p className="font-display text-4xl mb-1">
                  {formatMoney(monthlyEquivalent)}
                  <span className="font-label text-label-md">{t("pricing.perMonth")}</span>
                </p>
                {period === "yearly" && plan.price_monthly > 0 ? (
                  <p className="font-label text-label-md text-secondary mb-4">
                    {t("pricing.billedYearly", { price: formatMoney(price), percent: savingsPercent })}
                  </p>
                ) : period === "half_yearly" && plan.price_monthly > 0 ? (
                  <p className="font-label text-label-md text-secondary mb-4">
                    {t("pricing.billedHalfYearly", { price: formatMoney(price) })}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}

                {Array.isArray(features) && features.length > 0 && (
                  <ul className="space-y-2.5 mb-4">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 font-body text-body-md">
                        <Icon name="check" className="text-secondary text-lg shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {Array.isArray(locked) && locked.length > 0 && (
                  <ul className="space-y-2.5 mb-4">
                    {locked.map((item) => (
                      <li key={item} className="flex items-start gap-2 font-body text-body-md text-on-surface-variant opacity-60">
                        <Icon name="lock" className="text-lg shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-4">
                  <SubscribeButton
                    plan={plan}
                    period={period}
                    price={price}
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
