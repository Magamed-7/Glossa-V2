import { useParams } from "react-router-dom";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getPublicProfile } from "../lib/api/profile.js";

export default function PublicProfile() {
  const { userId } = useParams();
  const { data: profile, loading, error, reload } = useApi(() => getPublicProfile(userId), [userId]);

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
        <div>
          <h1 className="font-display text-headline-lg">{profile.username}</h1>
          {profile.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
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
            <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">Followers</span>
          </div>
          <div>
            <span className="font-display text-2xl">{profile.following_count}</span>
            <span className="font-label text-label-md uppercase text-on-surface-variant ml-2">Following</span>
          </div>
        </div>
      )}

      <div>{/* Follow button and stats go here */}</div>
    </div>
  );
}
