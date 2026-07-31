import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import { createCheckoutSession } from "../../lib/api/payments.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function TopupForm() {
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  async function onTopup() {
    setSubmitting(true);
    try {
      const { url } = await createCheckoutSession({ amount, currency: "usd" });
      window.location.href = url;
    } catch (err) {
      toast.error(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">Top Up</h3>
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
        label="Custom amount (USD)"
        type="number"
        min="1"
        step="1"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mb-4"
      />
      <NeoButton loading={submitting} onClick={onTopup} disabled={!amount || amount <= 0}>
        Pay with Card
      </NeoButton>
    </NeoCard>
  );
}
