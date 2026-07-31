import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NeoCard from "../components/ui/NeoCard.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { getBalance } from "../lib/api/payments.js";
import { formatMoney } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

export default function StripeReturn() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cancelled = searchParams.get("cancelled") === "1";

  const [status, setStatus] = useState(cancelled ? "cancelled" : "checking");
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (cancelled) return undefined;

    const before = sessionStorage.getItem("glossa_balance_before_topup");
    let attempt = 0;
    let cancelledEffect = false;

    async function poll() {
      attempt += 1;
      const { balance: current } = await getBalance();

      if (cancelledEffect) return;

      if (before === null || Number(current) !== Number(before)) {
        setBalance(current);
        setStatus("success");
        sessionStorage.removeItem("glossa_balance_before_topup");
        return;
      }

      if (attempt >= MAX_ATTEMPTS) {
        setStatus("pending");
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelledEffect = true;
    };
  }, [cancelled]);

  return (
    <div className="max-w-md mx-auto">
      <NeoCard className="text-center">
        {status === "checking" && (
          <>
            <Icon name="hourglass_top" className="text-4xl text-secondary mb-4" />
            <p className="font-body text-body-md">{t("stripeReturn.confirming")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <Icon name="check_circle" filled className="text-4xl text-secondary mb-4" />
            <h2 className="font-headline text-headline-md mb-2">{t("stripeReturn.confirmedTitle")}</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-6">
              {t("stripeReturn.newBalance", { balance: formatMoney(balance) })}
            </p>
            <NeoButton onClick={() => navigate("/wallet")}>{t("stripeReturn.backToWallet")}</NeoButton>
          </>
        )}

        {status === "pending" && (
          <>
            <Icon name="pending" className="text-4xl text-secondary mb-4" />
            <h2 className="font-headline text-headline-md mb-2">{t("stripeReturn.processingTitle")}</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-6">{t("stripeReturn.processingBody")}</p>
            <NeoButton onClick={() => navigate("/wallet")}>{t("stripeReturn.backToWallet")}</NeoButton>
          </>
        )}

        {status === "cancelled" && (
          <>
            <Icon name="cancel" className="text-4xl text-error mb-4" />
            <h2 className="font-headline text-headline-md mb-2">{t("stripeReturn.cancelledTitle")}</h2>
            <p className="font-body text-body-md text-on-surface-variant mb-6">{t("stripeReturn.cancelledBody")}</p>
            <NeoButton onClick={() => navigate("/wallet")}>{t("stripeReturn.backToWallet")}</NeoButton>
          </>
        )}
      </NeoCard>
    </div>
  );
}
