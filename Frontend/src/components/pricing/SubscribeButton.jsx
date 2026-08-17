import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import Modal from "../ui/Modal.jsx";
import { subscribe } from "../../lib/api/subscriptions.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";
import { formatMoney } from "../../lib/format.js";

export default function SubscribeButton({ plan, period, price, isCurrent, onSubscribed }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function onConfirm() {
    setConfirming(false);
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
    <>
      <NeoButton className="w-full" loading={submitting} onClick={() => setConfirming(true)}>
        {t(`pricing.plans.${plan.code}.cta`) || t("pricing.choose", { code: plan.code })}
      </NeoButton>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={t("pricing.confirmTitle")}>
        <p className="font-body text-body-md mb-6">
          {t("pricing.confirmBody", { code: t(`pricing.plans.${plan.code}.name`), price: formatMoney(price) })}
        </p>
        <div className="flex gap-3">
          <NeoButton className="flex-1" onClick={onConfirm}>
            {t("pricing.confirmYes")}
          </NeoButton>
          <NeoButton variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
            {t("pricing.confirmNo")}
          </NeoButton>
        </div>
      </Modal>
    </>
  );
}
