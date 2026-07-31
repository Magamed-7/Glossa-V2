import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import ProfileEditor from "../components/profile/ProfileEditor.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import * as authApi from "../lib/api/auth.js";

export default function MyProfile() {
  const { profile, refreshUser } = useAuth();
  const { data: account, loading, error, reload } = useApi(() => authApi.getMe(), []);

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-6 mb-section-gap">
        <Avatar photoUrl={profile?.photo_url} name={account.username} size="xl" />
        <div>
          <h1 className="font-display text-headline-lg">{account.username}</h1>
          {profile?.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
      </div>
      {profile && <ProfileEditor profile={profile} onUpdated={refreshUser} />}
    </div>
  );
}
