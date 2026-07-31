import PageHeader from "../components/layout/PageHeader.jsx";
import NeoCard from "../components/ui/NeoCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import TopupForm from "../components/wallet/TopupForm.jsx";
import PaymentHistory from "../components/wallet/PaymentHistory.jsx";
import { useApi } from "../lib/useApi.js";
import { getBalance } from "../lib/api/payments.js";
import { formatMoney } from "../lib/format.js";

export default function Wallet() {
  const { data: balance, loading, error, reload } = useApi(() => getBalance(), []);

  return (
    <div>
      <PageHeader eyebrow="Your Funds" title="The" accent="Wallet" />

      {loading && <Skeleton className="h-40" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && balance && (
        <NeoCard variant="accent" className="mb-section-gap">
          <p className="font-label text-label-md uppercase text-on-surface-variant">Current Balance</p>
          <p className="font-display text-5xl text-secondary">{formatMoney(balance.balance)}</p>
        </NeoCard>
      )}

      <TopupForm />

      <div className="mt-section-gap">
        <h2 className="font-headline text-headline-md mb-4">History</h2>
        <PaymentHistory />
      </div>
    </div>
  );
}
