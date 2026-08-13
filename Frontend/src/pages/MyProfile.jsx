import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import ProfileEditor from "../components/profile/ProfileEditor.jsx";
import PhotoUpload from "../components/profile/PhotoUpload.jsx";
import LanguagesSection from "../components/profile/LanguagesSection.jsx";
import ConnectionLists from "../components/profile/ConnectionLists.jsx";
import { ChangeUsername, ChangeEmail } from "../components/settings/AccountSection.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyAchievements } from "../lib/api/achievements.js";
import { useT } from "../lib/i18n.jsx";

const getAchievementStyle = (achievement, index) => {
  const { code, threshold, icon } = achievement;
  
  if (code === "reviews_5") {
    return {
      cardClass: "bg-[#c59b27] text-black border-2 border-tertiary",
      leftBoxClass: "bg-black text-white font-display text-xl italic font-bold",
      leftContent: "5",
      isMax: false,
    };
  }
  if (code === "streak_1") {
    return {
      cardClass: "bg-secondary text-white border-2 border-tertiary",
      leftBoxClass: "bg-black text-white",
      leftContent: <Icon name="local_fire_department" className="text-2xl filled" />,
      isMax: false,
    };
  }
  if (code === "streak_2") {
    return {
      cardClass: "bg-black text-white border-2 border-tertiary",
      leftBoxClass: "bg-white text-black",
      leftContent: <Icon name="local_fire_department" className="text-2xl filled" />,
      isMax: false,
    };
  }

  // Dynamic levels mapping
  if (threshold === 2 || (index % 4 === 1)) {
    return {
      cardClass: "bg-[#ffdadb] text-secondary border-2 border-tertiary",
      leftBoxClass: "bg-secondary text-white",
      leftContent: <Icon name={icon || "rate_review"} className="text-2xl" />,
      isMax: threshold >= 10,
    };
  }
  if (threshold === 3 || (index % 4 === 2)) {
    return {
      cardClass: "bg-[#ffe6cc] text-black border-2 border-tertiary",
      leftBoxClass: "bg-black text-white",
      leftContent: <Icon name={icon || "rate_review"} className="text-2xl" />,
      isMax: threshold >= 10,
    };
  }
  if (threshold >= 10) {
    return {
      cardClass: "bg-[#e5e2df] text-black border-2 border-tertiary relative overflow-hidden",
      leftBoxClass: "bg-secondary text-white",
      leftContent: <Icon name={icon || "rate_review"} className="text-2xl" />,
      isMax: true,
    };
  }

  // Default grey style
  return {
    cardClass: "bg-[#e5e2df] text-black border-2 border-tertiary",
    leftBoxClass: "bg-black text-white",
    leftContent: <Icon name={icon || "rate_review"} className="text-2xl" />,
    isMax: false,
  };
};

export default function MyProfile() {
  const t = useT();
  const { user, profile, languages, refreshUser } = useAuth();
  const { data: earnedAchievements, loading: loadingAch, error: errorAch } = useApi(() => getMyAchievements(), []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-6 mb-section-gap">
        <PhotoUpload photoUrl={profile?.photo_url} name={user?.username} onUploaded={refreshUser} />
        <div>
          <h1 className="font-headline italic text-headline-lg text-secondary">{user?.username}</h1>
          {profile?.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
      </div>
      
      {profile && <ProfileEditor profile={profile} onUpdated={refreshUser} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ChangeUsername />
        <ChangeEmail />
      </div>

      <div className="mt-6">
        <LanguagesSection languages={languages} onAdded={refreshUser} />
      </div>

      {/* Achievements Section */}
      <div className="mt-6 border-2 border-tertiary p-6 bg-surface hard-shadow">
        <h2 className="font-headline text-headline-md mb-6 text-on-surface uppercase tracking-tight flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          {t("achievements.eyebrow")}
        </h2>
        {loadingAch && <Skeleton className="h-20" />}
        {errorAch && <p className="text-sm text-error font-mono">Failed to load achievements</p>}
        {!loadingAch && !errorAch && earnedAchievements && (
          earnedAchievements.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant italic">
              {t("achievements.emptyTitle") || "You haven't earned any achievements yet. Keep studying!"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {earnedAchievements.map((a, index) => {
                const style = getAchievementStyle(a, index);
                return (
                  <div key={a.id} className={`p-4 flex items-center gap-3 hard-shadow relative ${style.cardClass}`}>
                    {style.isMax && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-secondary border-r-secondary border-b-[16px] border-b-transparent border-l-[16px] border-l-transparent" />
                    )}
                    <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 border-primary ${style.leftBoxClass}`}>
                      {style.leftContent}
                    </div>
                    <div className="flex flex-col select-none pr-3">
                      <h4 className="font-label text-xs uppercase font-bold tracking-tight leading-tight flex items-center gap-1">
                        {a.title.toUpperCase()}
                        {style.isMax && (
                          <span className="bg-black text-white px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm leading-none ml-1">
                            MAX
                          </span>
                        )}
                      </h4>
                      <span className="font-ledger text-[10px] opacity-70 mt-1">
                        {a.earned_at ? new Date(a.earned_at).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <div className="mt-6">
        <ConnectionLists />
      </div>
    </div>
  );
}

