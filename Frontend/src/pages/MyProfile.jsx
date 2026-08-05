import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import ProfileEditor from "../components/profile/ProfileEditor.jsx";
import PhotoUpload from "../components/profile/PhotoUpload.jsx";
import PrivacySettings from "../components/profile/PrivacySettings.jsx";
import LanguagesSection from "../components/profile/LanguagesSection.jsx";
import ConnectionLists from "../components/profile/ConnectionLists.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import * as authApi from "../lib/api/auth.js";

export default function MyProfile() {
  const { profile, languages, refreshUser } = useAuth();
  const { data: account, loading, error, reload } = useApi(() => authApi.getMe(), []);

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
      <div className="mt-6">
        <PrivacySettings />
      </div>
      <div className="mt-6">
        <ConnectionLists />
      </div>
    </div>
  );
}
