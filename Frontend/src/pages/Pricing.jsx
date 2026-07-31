import PageHeader from "../components/layout/PageHeader.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PlanComparison from "../components/pricing/PlanComparison.jsx";
import { useApi } from "../lib/useApi.js";
import { getPlans } from "../lib/api/subscriptions.js";
import { formatMoney } from "../lib/format.js";

export default function Pricing() {
  const { data: plans, loading, error, reload } = useApi(() => getPlans(), []);

  return (
    <div>
      <PageHeader
        eyebrow="Choose Your Tier"
        title="Study"
        accent="Plans"
        subtitle="From free daily practice to unlimited access across every feature."
      />

      {loading && <Skeleton className="h-96" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && plans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
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
              <p className="font-display text-4xl mb-6">
                {formatMoney(plan.price_monthly)}
                <span className="font-label text-label-md">/mo</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && plans && <PlanComparison plans={plans} />}
    </div>
  );
}
