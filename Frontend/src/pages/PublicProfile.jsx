import { useParams } from "react-router-dom";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import FollowButton from "../components/profile/FollowButton.jsx";
import { useApi } from "../lib/useApi.js";
import { getPublicProfile } from "../lib/api/profile.js";
import { readUserId } from "../lib/auth/tokens.js";
import { useT } from "../lib/i18n.jsx";

export default function PublicProfile() {
  const t = useT();
  const { userId } = useParams();
  const { data: profile, loading, error, reload } = useApi(() => getPublicProfile(userId), [userId]);
  const isMine = Number(readUserId()) === Number(userId);

  if (loading) return <Skeleton className="h-64 max-w-2xl mx-auto" />;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-section-gap">
        <Avatar photoUrl={profile.photo_url} name={profile.username} size="xl" />
        <div className="flex-1">
          <h1 className="font-display text-headline-lg">{profile.username}</h1>
          {profile.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
        {!isMine && <FollowButton userId={userId} />}
      </div>

      {/* Поля, скрытые владельцем приватности, отсутствуют в объекте целиком, а не равны null —
          проверка через "in", а не на truthiness (API_CONTRACT.md). */}
      {"languages" in profile && profile.languages.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {profile.languages.map((lang) => (
            <span key={lang.id} className="flex items-center gap-2 border-2 border-tertiary px-3 py-1">
              <span className="font-body text-body-md">{lang.language}</span>
              {lang.level && <Badge level={lang.level} className="text-[10px] px-2 py-0.5" />}
            </span>
          ))}
        </div>
      )}

      {"followers_count" in profile && (
        <div className="flex gap-8 mb-8">
          <div>
            <span className="font-display text-2xl">{profile.followers_count}</span>
            <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.followers")}</span>
          </div>
          <div>
            <span className="font-display text-2xl">{profile.following_count}</span>
            <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.following")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
