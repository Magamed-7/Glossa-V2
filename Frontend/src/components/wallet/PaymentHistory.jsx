import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getHistory } from "../../lib/api/payments.js";
import { formatDate, formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function PaymentHistory() {
  const t = useT();
  const { data: history, loading } = useApi(() => getHistory(), []);

  if (loading) return <Skeleton className="h-48" />;
  if (!history || history.length === 0) {
    return <EmptyState icon="receipt_long" title={t("wallet.noTransactionsTitle")} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-tertiary">
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("wallet.date")}</th>
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("wallet.type")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("wallet.amount")}</th>
            <th scope="col" className="text-right py-3 font-label text-label-md uppercase">{t("wallet.yourIncome")}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, i) => (
            <tr
              key={entry.id}
              className={`border-b border-surface-container-highest ${i % 2 === 1 ? "bg-surface-container" : ""}`}
            >
              <td className="py-3 font-body text-body-md">{formatDate(entry.created_at)}</td>
              <td className="py-3 font-body text-body-md capitalize">{entry.item_type.replace("_", " ")}</td>
              <td className="py-3 text-right font-ledger">{formatMoney(entry.amount)}</td>
              <td className="py-3 text-right font-ledger text-secondary">
                {entry.seller_income != null ? formatMoney(entry.seller_income) : t("common.dash")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
