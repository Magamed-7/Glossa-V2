import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import ProfileEditor from "../components/profile/ProfileEditor.jsx";
import PhotoUpload from "../components/profile/PhotoUpload.jsx";
import PrivacySettings from "../components/profile/PrivacySettings.jsx";
import LanguagesSection from "../components/profile/LanguagesSection.jsx";
import ConnectionLists from "../components/profile/ConnectionLists.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import * as authApi from "../lib/api/auth.js";
import { getMyAchievements } from "../lib/api/achievements.js";
import { useT } from "../lib/i18n.jsx";

export default function MyProfile() {
  const t = useT();
  const { profile, languages, refreshUser } = useAuth();
  const { data: account, loading, error, reload } = useApi(() => authApi.getMe(), []);
  const { data: earnedAchievements, loading: loadingAch, error: errorAch } = useApi(() => getMyAchievements(), []);

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-6 mb-section-gap">
        <PhotoUpload photoUrl={profile?.photo_url} name={account.username} onUploaded={refreshUser} />
        <div>
          <h1 className="font-headline italic text-headline-lg text-secondary">{account.username}</h1>
          {profile?.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
      </div>
      {profile && <ProfileEditor profile={profile} onUpdated={refreshUser} />}
      <div className="mt-6">
        <LanguagesSection languages={languages} onAdded={refreshUser} />
      </div>

      {/* Achievements Section */}
      <div className="mt-6 border-2 border-tertiary p-6 bg-surface hard-shadow">
        <h2 className="font-headline text-headline-md mb-4 text-on-surface uppercase tracking-tight">
          {t("achievements.eyebrow") || "Achievements"}
        </h2>
        {loadingAch && <Skeleton className="h-20" />}
        {errorAch && <p className="text-sm text-error font-mono">Failed to load achievements</p>}
        {!loadingAch && !errorAch && earnedAchievements && (
          earnedAchievements.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant italic">
              {t("achievements.emptyTitle") || "You haven't earned any achievements yet. Keep studying!"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {earnedAchievements.map((a) => (
                <div key={a.id} className="border border-tertiary p-3 bg-surface-variant flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-tertiary flex items-center justify-center text-on-tertiary">
                    <Icon name={a.icon || "military_tech"} className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-bold uppercase tracking-tight text-on-surface">
                      {a.title}
                    </h4>
                    {a.earned_at && (
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">
                        {new Date(a.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-6">
        <PrivacySettings />
      </div>
      <div className="mt-6">
        <ConnectionLists />
      </div>
    </div>
  );
}

