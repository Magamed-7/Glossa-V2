import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { buyUserStory } from "../../lib/api/userStories.js";
import { getBalance } from "../../lib/api/payments.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { formatMoney } from "../../lib/format.js";

export default function BuyButton({ story, onPurchased }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [buying, setBuying] = useState(false);

  async function onBuy() {
    setBuying(true);

    try {
      const { balance } = await getBalance();
      if (story.price && Number(balance) < Number(story.price)) {
        toast.error("Insufficient balance — top up your wallet first.");
        navigate("/wallet");
        return;
      }

      await buyUserStory(story.id);
      toast.success("Story unlocked!");
      onPurchased();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBuying(false);
    }
  }

  return (
    <NeoButton onClick={onBuy} loading={buying}>
      Buy for {story.price ? formatMoney(story.price) : "Free"}
    </NeoButton>
  );
}
