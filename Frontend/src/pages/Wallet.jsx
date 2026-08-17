import PageHeader from "../components/layout/PageHeader.jsx";
import NeoCard from "../components/ui/NeoCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import TopupForm from "../components/wallet/TopupForm.jsx";
import PaymentHistory from "../components/wallet/PaymentHistory.jsx";
import WalletAnalytics from "../components/wallet/WalletAnalytics.jsx";
import { useApi } from "../lib/useApi.js";
import { getBalance } from "../lib/api/payments.js";
import { formatMoney } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

export default function Wallet() {
  const t = useT();
  const { data: balance, loading, error, reload } = useApi(() => getBalance(), []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      <PageHeader eyebrow={t("wallet.eyebrow")} title={t("wallet.titleLead")} accent={t("wallet.titleAccent")} />

      {loading && <Skeleton className="h-48 w-full mb-section-gap" />}
      {error && <ErrorState error={error} onRetry={reload} className="mb-section-gap" />}

      {!loading && !error && balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-stretch">
          {/* Стилизованная банковская карта баланса */}
          <div className="relative bg-[#fcd34d] dark:bg-yellow-500 text-black border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_var(--color-tertiary)] overflow-hidden flex flex-col justify-between h-56 min-h-[220px] transition-transform hover:-translate-y-1">
            {/* Декоративные полосы на фоне в стиле ретро */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b90538]/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-12 bg-black/5 -skew-y-12 translate-y-4 translate-x-4 pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="font-ledger text-[11px] uppercase tracking-widest text-black/60 font-bold">Glossa Bank</p>
                <p className="font-display text-lg font-bold text-black italic">Prepaid Debit</p>
              </div>
              {/* Ретро-чип карты */}
              <div className="w-12 h-9 rounded bg-[#d97706]/40 border-2 border-black relative p-1 flex flex-wrap gap-px">
                <div className="w-full h-1 bg-black/20" />
                <div className="w-1/2 h-4 border-r border-black/30" />
                <div className="w-1/2 h-4" />
                <div className="w-full h-1 bg-black/20" />
              </div>
            </div>

            <div className="my-2">
              <p className="font-label text-[10px] uppercase tracking-wider text-black/60">{t("wallet.currentBalance")}</p>
              <p className="font-ledger text-4xl font-black text-black tracking-tight">{formatMoney(balance.balance)}</p>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="font-ledger text-[9px] tracking-wider text-black/50">CARDHOLDER</p>
                <p className="font-ledger text-sm font-bold tracking-wider text-black uppercase">Glossa Member</p>
              </div>
              <div className="text-right">
                <p className="font-ledger text-[9px] tracking-wider text-black/50">EXPIRES</p>
                <p className="font-ledger text-sm font-bold text-black">12/29</p>
              </div>
            </div>
          </div>

          {/* Форма пополнения */}
          <div className="flex flex-col justify-stretch">
            <TopupForm />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        <div>
          <WalletAnalytics />
        </div>

        <div className="border-t-4 border-black pt-8 mt-4">
          <h2 className="font-headline text-headline-md mb-6">{t("wallet.history")}</h2>
          <PaymentHistory />
        </div>
      </div>
    </div>
  );
}
