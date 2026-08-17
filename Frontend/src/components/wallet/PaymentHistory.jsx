import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import Icon from "../ui/Icon.jsx";
import { useApi } from "../../lib/useApi.js";
import { getHistory } from "../../lib/api/payments.js";
import { formatDateTimeWithSeconds, formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function PaymentHistory() {
  const t = useT();
  const { data: history, loading } = useApi(() => getHistory(), []);

  if (loading) return <Skeleton className="h-48" />;
  if (!history || history.length === 0) {
    return <EmptyState icon="receipt_long" title={t("wallet.noTransactionsTitle")} />;
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => {
        const isTopup = entry.item_type === "topup";
        const localizedType = t(`wallet.type_${entry.item_type}`) || entry.item_type.replace("_", " ");
        
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 bg-surface border-2 border-black dark:border-stone-800 shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_var(--color-tertiary)] rounded transition-transform hover:-translate-y-0.5"
          >
            {/* Левая часть: Иконка и детальная информация */}
            <div className="flex items-center gap-4">
              <div 
                className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] shrink-0 ${
                  isTopup 
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                    : "bg-red-100 dark:bg-red-950/40 text-secondary"
                }`}
              >
                <Icon 
                  name={isTopup ? "arrow_downward" : "arrow_upward"} 
                  className="font-bold" 
                />
              </div>

              <div>
                <p className="font-body font-bold text-on-surface text-sm md:text-base">
                  {localizedType}
                </p>
                <p className="font-ledger text-[11px] text-on-surface-variant mt-0.5">
                  {formatDateTimeWithSeconds(entry.created_at)}
                </p>
              </div>
            </div>

            {/* Правая часть: Сумма и доход (если есть) */}
            <div className="text-right">
              <p className={`font-ledger font-black text-base md:text-lg ${
                isTopup ? "text-emerald-600 dark:text-emerald-400" : "text-on-surface"
              }`}>
                {isTopup ? "+" : "-"}{formatMoney(entry.amount)}
              </p>
              
              {entry.seller_income != null && Number(entry.seller_income) > 0 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-ledger font-bold mt-0.5">
                  {t("wallet.yourIncome")}: +{formatMoney(entry.seller_income)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
