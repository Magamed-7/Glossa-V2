import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PlanComparison from "../components/pricing/PlanComparison.jsx";
import { useApi } from "../lib/useApi.js";
import { getPlans } from "../lib/api/subscriptions.js";
import { formatMoney } from "../lib/format.js";

export default function Pricing() {
  const { data: plans, loading, error, reload } = useApi(() => getPlans(), []);
  const [period, setPeriod] = useState("monthly");

  return (
    <div>
      <PageHeader
        eyebrow="Choose Your Tier"
        title="Study"
        accent="Plans"
        subtitle="From free daily practice to unlimited access across every feature."
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
            Monthly
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-label text-label-md uppercase ${
              period === "yearly" ? "bg-secondary text-on-secondary" : ""
            }`}
            onClick={() => setPeriod("yearly")}
          >
            Yearly
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

            return (
              <div
                key={plan.id}
                className={`border-2 border-tertiary p-8 flex flex-col ${
                  plan.code === "premium" ? "hard-shadow-crimson" : "hard-shadow"
                }`}
              >
                {plan.code === "premium" && (
                  <span className="self-start bg-secondary text-on-secondary font-label text-label-md uppercase px-3 py-1 mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="font-headline text-headline-md uppercase mb-2">{plan.code}</h3>
                <p className="font-display text-4xl mb-1">
                  {formatMoney(monthlyEquivalent)}
                  <span className="font-label text-label-md">/mo</span>
                </p>
                {period === "yearly" && plan.price_monthly > 0 && (
                  <p className="font-label text-label-md text-secondary mb-4">
                    {formatMoney(price)} billed yearly · save {savingsPercent}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && plans && <PlanComparison plans={plans} />}
    </div>
  );
}
