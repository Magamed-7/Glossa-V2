import { Link } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import ProfileEditor from "../components/profile/ProfileEditor.jsx";
import PhotoUpload from "../components/profile/PhotoUpload.jsx";
import LanguagesSection from "../components/profile/LanguagesSection.jsx";
import ConnectionLists from "../components/profile/ConnectionLists.jsx";
import { ChangeUsername, ChangeEmail } from "../components/settings/AccountSection.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyAchievements } from "../lib/api/achievements.js";
import { useT, useI18n } from "../lib/i18n.jsx";
import { translateAchievement } from "../lib/achievementsTranslation.js";

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

// Light → Dark palette map (matches Achievements.jsx)
const DARK_CARD_PALETTES = [
  { light: "bg-gradient-to-br from-[#e5e2df] to-[#c8c5c2] text-black border-2 border-primary", dark: "dark:from-[#2a2825] dark:to-[#1a1816] dark:text-stone-100 dark:border-stone-600", iconLight: "bg-black text-white", iconDark: "dark:bg-stone-200 dark:text-stone-900" },
  { light: "bg-gradient-to-br from-[#ffd6e0] to-[#ffa3b1] text-secondary border-2 border-primary", dark: "dark:from-[#4a0d1f] dark:to-[#2d0510] dark:text-rose-200 dark:border-rose-900", iconLight: "bg-secondary text-white", iconDark: "dark:bg-rose-700 dark:text-white" },
  { light: "bg-gradient-to-br from-[#ffe6cc] to-[#ffcc99] text-black border-2 border-primary", dark: "dark:from-[#3d2000] dark:to-[#251200] dark:text-amber-200 dark:border-amber-900", iconLight: "bg-black text-white", iconDark: "dark:bg-amber-700 dark:text-white" },
  { light: "bg-gradient-to-br from-[#d2f4ea] to-[#a3e4d7] text-teal-900 border-2 border-primary", dark: "dark:from-[#042e26] dark:to-[#021a16] dark:text-teal-200 dark:border-teal-900", iconLight: "bg-teal-800 text-white", iconDark: "dark:bg-teal-600 dark:text-white" },
];

const DARK_SPECIAL = {
  reviews_5: { light: "bg-gradient-to-br from-[#ca8a04] via-[#eab308] to-[#fef08a] text-black border-2 border-primary", dark: "dark:from-[#3d2800] dark:to-[#1f1400] dark:text-yellow-200 dark:border-yellow-800", iconLight: "bg-black text-white font-display text-xl italic font-bold", iconDark: "dark:bg-yellow-700 dark:text-white" },
  streak_1: { light: "bg-gradient-to-br from-[#dc2c4f] to-[#b90538] text-white border-2 border-primary", dark: "dark:from-[#5a0a1e] dark:to-[#350310] dark:text-rose-100 dark:border-rose-800", iconLight: "bg-black text-white", iconDark: "dark:bg-rose-900 dark:text-white" },
  streak_2: { light: "bg-gradient-to-br from-[#2c2c2c] to-[#000000] text-white border-2 border-primary", dark: "dark:from-[#111111] dark:to-[#000000] dark:text-stone-100 dark:border-stone-700", iconLight: "bg-white text-black", iconDark: "dark:bg-stone-300 dark:text-black" },
};

const getAchievementStyle = (achievement, index) => {
  const { code, icon } = achievement;
  const resolved = resolveIcon(icon);
  const threshold = parseInt(code.split("_").pop(), 10) || 0;
  const isMax = threshold >= 10 || code.endsWith("_100") || code.endsWith("_500");

  let leftContent = null;
  if (code === "reviews_5" || code.startsWith("words_")) {
    leftContent = threshold.toString();
  } else if (code.startsWith("streak_")) {
    leftContent = <Icon name="local_fire_department" className="text-2xl filled" />;
  } else {
    leftContent = <Icon name={resolved} className="text-2xl" />;
  }

  if (DARK_SPECIAL[code]) {
    const sp = DARK_SPECIAL[code];
    return {
      cardClass: `${sp.light} ${sp.dark}`,
      leftBoxClass: `${sp.iconLight} ${sp.iconDark}`,
      leftContent,
      isMax,
    };
  }

  const palette = DARK_CARD_PALETTES[index % 4];
  return {
    cardClass: `${palette.light} ${palette.dark}`,
    leftBoxClass: `${palette.iconLight} ${palette.iconDark}`,
    leftContent,
    isMax,
  };
};


export default function MyProfile() {
  const t = useT();
  const { lang } = useI18n();
  const { user, profile, languages, refreshUser } = useAuth();
  const { data: earnedAchievements, loading: loadingAch, error: errorAch } = useApi(() => getMyAchievements(), []);

  const isPro = profile?.subscription_tier === "pro";
  const isPremium = profile?.subscription_tier === "premium";

  let avatarWrapperClass = "relative";
  if (isPro) {
    avatarWrapperClass = "relative rounded-full ring-4 ring-amber-400 p-1 bg-amber-400 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
  } else if (isPremium) {
    avatarWrapperClass = "relative rounded-full ring-4 ring-secondary p-1 bg-secondary border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  }

  // Helper local translations
  const lookup = (key, fallback) => {
    const res = t(key);
    return res === key ? fallback : res;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-section-gap bg-[#FAF8F5] dark:bg-stone-900 border-2 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className={avatarWrapperClass}>
          <PhotoUpload photoUrl={profile?.photo_url} name={user?.username} onUploaded={refreshUser} />
          {isPremium && (
            <span className="absolute -bottom-1 -right-1 bg-white border-2 border-primary text-lg rounded-full w-7 h-7 flex items-center justify-center shadow">
              👑
            </span>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="font-headline italic text-headline-lg text-secondary">{user?.username}</h1>
            <div className="flex justify-center sm:justify-start gap-2">
              {isPro && (
                <span className="bg-amber-400 text-black border border-primary font-label text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  ⚡ {lookup("profile.tierPro", "PRO member")}
                </span>
              )}
              {isPremium && (
                <span className="bg-secondary text-white border border-primary font-label text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  👑 {lookup("profile.tierPremium", "PREMIUM elite")}
                </span>
              )}
            </div>
          </div>
          {profile?.bio && <p className="font-body text-body-lg italic text-on-surface-variant mt-2">{profile.bio}</p>}
        </div>
        {user?.id && (
          <Link
            to={`/profile/${user.id}`}
            className="flex items-center gap-2 border-2 border-primary bg-surface dark:bg-stone-950 px-4 py-2 font-label text-label-md uppercase tracking-wide hover:bg-surface-container transition-colors hard-shadow max-w-full md:max-w-xs"
          >
            <Icon name="visibility" className="shrink-0" />
            <span className="min-w-0 break-words leading-tight">{t("profile.previewPublic")}</span>
          </Link>
        )}
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
      <div className="mt-6 border-2 border-tertiary dark:border-stone-700 p-6 bg-surface dark:bg-stone-950 hard-shadow">
        <h2 className="font-headline text-headline-md mb-6 text-on-surface dark:text-stone-100 uppercase tracking-tight flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          {t("achievements.eyebrow")}
        </h2>
        {loadingAch && <Skeleton className="h-20" />}
        {errorAch && <p className="text-sm text-error font-mono">Failed to load achievements</p>}
        {!loadingAch && !errorAch && earnedAchievements && (
          earnedAchievements.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant dark:text-stone-400 italic">
              {t("achievements.emptyTitle") || "You haven't earned any achievements yet. Keep studying!"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {earnedAchievements.map((a, index) => {
                const style = getAchievementStyle(a, index);
                const translated = translateAchievement(a, lang);
                return (
                  <div key={a.id} className={`p-4 flex items-center gap-3 hard-shadow relative ${style.cardClass}`}>
                    {style.isMax && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-secondary dark:border-t-rose-600 border-r-secondary dark:border-r-rose-600 border-b-[16px] border-b-transparent border-l-[16px] border-l-transparent" />
                    )}
                    <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 border-primary dark:border-stone-600 ${style.leftBoxClass}`}>
                      {style.leftContent}
                    </div>
                    <div className="flex flex-col select-none pr-3">
                      <h4 className="font-label text-xs uppercase font-bold tracking-tight leading-tight flex items-center gap-1">
                        {translated.title.toUpperCase()}
                        {style.isMax && (
                          <span className="bg-black dark:bg-stone-200 text-white dark:text-black px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm leading-none ml-1">
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

