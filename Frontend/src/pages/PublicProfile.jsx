import { useParams } from "react-router-dom";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import FollowButton from "../components/profile/FollowButton.jsx";
import MessageButton from "../components/profile/MessageButton.jsx";
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
        {!isMine && (
          <div className="flex flex-col gap-2 shrink-0">
            <FollowButton userId={userId} />
            <MessageButton userId={userId} />
          </div>
        )}
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

      {("followers_count" in profile || "current_streak" in profile || "best_streak" in profile || "stories_read_count" in profile) && (
        <div className="flex flex-wrap gap-8 mb-8">
          {"followers_count" in profile && (
            <>
              <div>
                <span className="font-display text-2xl">{profile.followers_count}</span>
                <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.followers")}</span>
              </div>
              <div>
                <span className="font-display text-2xl">{profile.following_count}</span>
                <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.following")}</span>
              </div>
            </>
          )}
          {"current_streak" in profile && (
            <div>
              <span className="font-display text-2xl">{profile.current_streak}</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.currentStreak")}</span>
            </div>
          )}
          {"best_streak" in profile && (
            <div>
              <span className="font-display text-2xl">{profile.best_streak}</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.bestStreak")}</span>
            </div>
          )}
          {"stories_read_count" in profile && (
            <div>
              <span className="font-display text-2xl">{profile.stories_read_count}</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">{t("profile.storiesRead")}</span>
            </div>
          )}
        </div>
      )}

      {"achievements" in profile && profile.achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="font-label text-label-md uppercase text-on-surface-variant mb-3">{t("profile.achievements")}</h2>
          <div className="flex flex-wrap gap-3">
            {profile.achievements.map((achievement) => (
              <div
                key={achievement.id}
                title={achievement.title}
                className="flex items-center gap-2 border-2 border-tertiary px-3 py-2"
              >
                <Icon name={achievement.icon || "military_tech"} className="text-secondary" />
                <span className="font-body text-body-md">{achievement.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
