import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { buyUserStory } from "../../lib/api/userStories.js";
import { getBalance } from "../../lib/api/payments.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function BuyButton({ story, onPurchased }) {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [buying, setBuying] = useState(false);

  async function onBuy() {
    setBuying(true);

    try {
      const { balance } = await getBalance();
      if (story.price && Number(balance) < Number(story.price)) {
        toast.error(t("market.insufficientBalance"));
        navigate("/wallet");
        return;
      }

      await buyUserStory(story.id);
      toast.success(t("market.unlocked"));
      onPurchased();
    } catch (err) {
      toast.error(errorText(err));
      if (err.code === "CANNOT_BUY_STORIES") navigate("/pricing");
    } finally {
      setBuying(false);
    }
  }

  return (
    <NeoButton onClick={onBuy} loading={buying}>
      {t("market.buyFor", { price: story.price ? formatMoney(story.price) : t("market.free") })}
    </NeoButton>
  );
}
