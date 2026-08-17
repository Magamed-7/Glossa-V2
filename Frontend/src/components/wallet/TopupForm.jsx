import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import { getPaymentLink } from "../../lib/api/payments.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function TopupForm() {
  const t = useT();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function onGoToBot() {
    setSubmitting(true);
    try {
      const { link } = await getPaymentLink();
      window.location.href = link;
    } catch (err) {
      toast.error(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-2">{t("wallet.topUp")}</h3>
      <p className="font-body text-body-md text-on-surface-variant mb-4">{t("wallet.topUpViaBotHint")}</p>
      <NeoButton loading={submitting} onClick={onGoToBot}>
        <Icon name="send" className="mr-2" />
        {t("wallet.topUpViaBotButton")}
      </NeoButton>
    </NeoCard>
  );
}
