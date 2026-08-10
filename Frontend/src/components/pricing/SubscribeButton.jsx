import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { subscribe } from "../../lib/api/subscriptions.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function SubscribeButton({ plan, period, isCurrent, onSubscribed }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function onSubscribe() {
    setSubmitting(true);
    try {
      await subscribe({ plan_code: plan.code, period });
      toast.success(t("pricing.subscribed", { code: t(`pricing.plans.${plan.code}.name`) }));
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
        {t("pricing.currentPlan")}
      </NeoButton>
    );
  }

  return (
    <NeoButton className="w-full" loading={submitting} onClick={onSubscribe}>
      {t(`pricing.plans.${plan.code}.cta`) || t("pricing.choose", { code: plan.code })}
    </NeoButton>
  );
}
