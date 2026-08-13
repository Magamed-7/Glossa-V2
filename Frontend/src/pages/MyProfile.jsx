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

const resolveIcon = (iconName) => {
  if (!iconName) return "military_tech";
  const name = iconName.toLowerCase();
  if (name.startsWith("words_") || name === "menu_book") return "menu_book";
  if (name.startsWith("streak_") || name === "local_fire_department") return "local_fire_department";
  if (name.startsWith("reviews_received") || name === "stars") return "stars";
  if (name.startsWith("reviews_") || name === "rate_review") return "rate_review";
  if (name.startsWith("stories_written") || name === "history_edu") return "history_edu";
  if (name.startsWith("stories_sold") || name === "payments") return "payments";
  if (name.startsWith("friends_") || name === "group") return "group";
  return iconName;
};

const getAchievementStyle = (achievement, index) => {
  const { code, icon } = achievement;
  const resolved = resolveIcon(icon);
  const threshold = parseInt(code.split("_").pop(), 10) || 0;
  
  let cardClass = "";
  let leftBoxClass = "";
  let leftContent = null;
  let isMax = threshold >= 10 || code.endsWith("_100") || code.endsWith("_500");

  // Determine left side container content
  if (code === "reviews_5" || code.startsWith("words_")) {
    leftContent = threshold.toString();
    leftBoxClass = "bg-black text-white font-display text-xl italic font-bold";
  } else if (code.startsWith("streak_")) {
    leftContent = <Icon name="local_fire_department" className="text-2xl filled" />;
  } else {
    leftContent = <Icon name={resolved} className="text-2xl" />;
  }

  // Determine card gradient background class
  if (code === "reviews_5") {
    cardClass = "bg-gradient-to-br from-[#ca8a04] via-[#eab308] to-[#fef08a] text-black border-2 border-primary";
    leftBoxClass = "bg-black text-white font-display text-xl italic font-bold";
  } else if (code === "streak_1") {
    cardClass = "bg-gradient-to-br from-[#dc2c4f] to-[#b90538] text-white border-2 border-primary";
    leftBoxClass = "bg-black text-white";
  } else if (code === "streak_2") {
    cardClass = "bg-gradient-to-br from-[#2c2c2c] to-[#000000] text-white border-2 border-primary";
    leftBoxClass = "bg-white text-black";
  } else {
    const val = index % 4;
    if (val === 0) {
      cardClass = "bg-gradient-to-br from-[#e5e2df] to-[#c8c5c2] text-black border-2 border-primary";
      if (!leftBoxClass) leftBoxClass = "bg-black text-white";
    } else if (val === 1) {
      cardClass = "bg-gradient-to-br from-[#ffd6e0] to-[#ffa3b1] text-secondary border-2 border-primary";
      if (!leftBoxClass) leftBoxClass = "bg-secondary text-white";
    } else if (val === 2) {
      cardClass = "bg-gradient-to-br from-[#ffe6cc] to-[#ffcc99] text-black border-2 border-primary";
      if (!leftBoxClass) leftBoxClass = "bg-black text-white";
    } else {
      cardClass = "bg-gradient-to-br from-[#d2f4ea] to-[#a3e4d7] text-teal-900 border-2 border-primary";
      if (!leftBoxClass) leftBoxClass = "bg-teal-800 text-white";
    }
  }

  return {
    cardClass,
    leftBoxClass,
    leftContent,
    isMax,
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

