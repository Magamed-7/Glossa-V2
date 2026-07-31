import { useEffect, useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";
import { follow, getFollowing, unfollow } from "../../lib/api/social.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function FollowButton({ userId }) {
  const t = useT();
  const toast = useToast();
  const [following, setFollowing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getFollowing().then((list) => setFollowing(list.some((u) => u.id === Number(userId))));
  }, [userId]);

  async function onToggle() {
    const previous = following;
    setFollowing(!previous);
    setSubmitting(true);

    try {
      if (previous) await unfollow(userId);
      else await follow(userId);
    } catch (err) {
      setFollowing(previous);
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (following === null) return null;

  return (
    <NeoButton variant={following ? "ghost" : "primary"} loading={submitting} onClick={onToggle}>
      {following ? t("profile.unfollow") : t("profile.follow")}
    </NeoButton>
  );
}
