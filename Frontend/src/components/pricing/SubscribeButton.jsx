import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { subscribe } from "../../lib/api/subscriptions.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

export default function SubscribeButton({ plan, period, isCurrent, onSubscribed }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function onSubscribe() {
    setSubmitting(true);
    try {
      await subscribe({ plan_code: plan.code, period });
      toast.success(`You're now on the ${plan.code} plan!`);
      onSubscribed();
    } catch (err) {
      if (err.code === "INSUFFICIENT_FUNDS") {
        toast.error(errorText(err));
        navigate("/wallet");
      } else {
        toast.error(errorText(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isCurrent) {
    return (
      <NeoButton variant="ghost" disabled className="w-full">
        Current Plan
      </NeoButton>
    );
  }

  return (
    <NeoButton className="w-full" loading={submitting} onClick={onSubscribe}>
      Choose {plan.code}
    </NeoButton>
  );
}
