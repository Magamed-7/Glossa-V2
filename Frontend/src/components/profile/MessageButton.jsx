import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import { startConversation } from "../../lib/api/messenger.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function MessageButton({ userId }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function onClick() {
    setSubmitting(true);
    try {
      const conversation = await startConversation(Number(userId));
      navigate(`/messenger/${conversation.id}`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeoButton variant="ghost" loading={submitting} onClick={onClick}>
      {t("profile.message")}
    </NeoButton>
  );
}
