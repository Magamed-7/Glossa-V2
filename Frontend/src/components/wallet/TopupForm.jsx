import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import { createCheckoutSession, getBalance, topup } from "../../lib/api/payments.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function TopupForm({ onTopupSuccess }) {
  const t = useT();
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);

  async function onTopup() {
    setSubmitting(true);
    try {
      // Баланс до ухода на Stripe — точка отсчёта для StripeReturn, чтобы понять,
      // применился ли уже вебхук к моменту возврата пользователя.
      const { balance } = await getBalance();
      sessionStorage.setItem("glossa_balance_before_topup", balance);

      const { url } = await createCheckoutSession({ amount, currency: "usd" });
      window.location.href = url;
    } catch (err) {
      toast.error(errorText(err));
      setSubmitting(false);
    }
  }

  // TODO(remove before launch): прямое пополнение в обход Stripe, только для теста —
  // владелец продукта явно попросил эту кнопку на время, пока Stripe не настроен.
  async function onTestTopup() {
    setTestSubmitting(true);
    try {
      await topup(amount);
      toast.success(t("wallet.testTopupSuccess"));
      onTopupSuccess?.();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setTestSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">{t("wallet.topUp")}</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            className={`px-4 py-2 border-2 border-tertiary font-label text-label-md ${
              amount === value ? "bg-secondary text-on-secondary" : ""
            }`}
            onClick={() => setAmount(value)}
          >
            ${value}
          </button>
        ))}
      </div>
      <Field
        label={t("wallet.customAmountLabel")}
        type="number"
        min="1"
        step="1"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mb-4"
      />
      <NeoButton loading={submitting} onClick={onTopup} disabled={!amount || amount <= 0 || testSubmitting}>
        {t("wallet.payWithCard")}
      </NeoButton>

      <div className="mt-6 pt-6 border-t-2 border-dashed border-tertiary">
        <p className="font-label text-label-md uppercase text-on-surface-variant mb-3">
          {t("wallet.testModeLabel")}
        </p>
        <NeoButton
          variant="ghost"
          loading={testSubmitting}
          onClick={onTestTopup}
          disabled={!amount || amount <= 0 || submitting}
        >
          {t("wallet.testTopupButton")}
        </NeoButton>
      </div>
    </NeoCard>
  );
}
