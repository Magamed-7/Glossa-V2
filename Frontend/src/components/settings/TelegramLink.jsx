import { useState } from "react";
import { Link } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { getTelegramLink } from "../../lib/api/account.js";
import { getMySubscription } from "../../lib/api/subscriptions.js";
import { useApi } from "../../lib/useApi.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function TelegramLink() {
  const t = useT();
  const toast = useToast();
  const { data: subscription } = useApi(() => getMySubscription(), []);
  const [submitting, setSubmitting] = useState(false);

  async function onLink() {
    setSubmitting(true);
    try {
      const { link } = await getTelegramLink();
      window.open(link, "_blank", "noopener");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (subscription && !subscription.plan.telegram_access) {
    return (
      <div>
        <p className="font-body text-body-md text-on-surface-variant mb-4">{t("settings.telegram.requiresPlan")}</p>
        <Link to="/pricing">
          <NeoButton variant="ghost">{t("settings.telegram.viewPlans")}</NeoButton>
        </Link>
      </div>
    );
  }

  return (
    <NeoButton loading={submitting} onClick={onLink}>
      {t("settings.telegram.link")}
    </NeoButton>
  );
}
