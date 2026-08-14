import { useParams } from "react-router-dom";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import FollowButton from "../components/profile/FollowButton.jsx";
import MessageButton from "../components/profile/MessageButton.jsx";
import AcquisitionCard from "../components/market/AcquisitionCard.jsx";
import { useApi } from "../lib/useApi.js";
import { getPublicProfile } from "../lib/api/profile.js";
import { getUserStories } from "../lib/api/userStories.js";
import { getLingoServices } from "../lib/api/lingo.js";
import { readUserId } from "../lib/auth/tokens.js";
import { useT, useI18n } from "../lib/i18n.jsx";
import { translateAchievement } from "../lib/achievementsTranslation.js";
import { formatMoney } from "../lib/format.js";

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

export default function PublicProfile() {
  const t = useT();
  const { lang } = useI18n();
  const { userId } = useParams();
  const { data: profile, loading, error, reload } = useApi(() => getPublicProfile(userId), [userId]);
  
  const { data: authoredStories } = useApi(
    () => getUserStories({ authorId: Number(userId), limit: 12 }),
    [userId]
  );

  const { data: services } = useApi(
    () => getLingoServices({ providerId: Number(userId) }),
    [userId]
  );

  const isMine = Number(readUserId()) === Number(userId);

  // Helper local translations
  const lookup = (key, fallback) => {
    const res = t(key);
    return res === key ? fallback : res;
  };

  if (loading) return <Skeleton className="h-64 max-w-4xl mx-auto" />;
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const isPro = profile.subscription_tier === "pro";
  const isPremium = profile.subscription_tier === "premium";

  let avatarWrapperClass = "relative";
  if (isPro) {
    avatarWrapperClass = "relative rounded-full ring-4 ring-amber-400 p-1 bg-amber-400 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
  } else if (isPremium) {
    avatarWrapperClass = "relative rounded-full ring-4 ring-secondary p-1 bg-secondary border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* 1. Header Profile Box */}
      <div className="border-2 border-primary bg-[#FAF8F5] dark:bg-stone-900 p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className={avatarWrapperClass}>
          <Avatar photoUrl={profile.photo_url} name={profile.username} size="xl" />
          {isPremium && (
            <span className="absolute -bottom-1 -right-1 bg-white border-2 border-primary text-xl rounded-full w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              👑
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-headline-xl font-bold tracking-tight text-primary">
              {profile.username}
            </h1>
            {isPro && (
              <span className="bg-amber-400 text-black border-2 border-primary font-label text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ⚡ {lookup("profile.tierPro", "PRO member")}
              </span>
            )}
            {isPremium && (
              <span className="bg-secondary text-white border-2 border-primary font-label text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                👑 {lookup("profile.tierPremium", "PREMIUM elite")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-label text-label-sm uppercase text-on-surface-variant font-semibold">
            {profile.created_at && (
              <span>
                📅 {lookup("profile.memberSince", "Member since")}: {new Date(profile.created_at).toLocaleDateString()}
              </span>
            )}
            <span>
              👁️ {lookup("profile.viewCount", "Profile Views")}: {profile.profile_views}
            </span>
          </div>

          {profile.bio && (
            <p className="font-body text-body-lg italic text-on-surface-variant bg-surface dark:bg-stone-950 p-4 border-l-4 border-secondary border-t border-r border-b border-primary">
              {profile.bio}
            </p>
          )}

          {/* Interests Section */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="font-label text-label-xs uppercase tracking-widest text-on-surface-variant font-bold block">
                {lookup("profile.interests", "Interests")}
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-[#ffe6cc] dark:bg-stone-950 border border-primary text-black dark:text-stone-300 font-body text-xs px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isMine && (
          <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t-2 md:border-t-0 md:border-l-2 border-dotted border-primary pl-0 md:pl-6">
            <FollowButton userId={userId} className="flex-1 md:flex-none justify-center" />
            <MessageButton userId={userId} className="flex-1 md:flex-none justify-center" />
          </div>
        )}
      </div>

      {/* 2. Stats & Languages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Connection & Activity stats */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {"followers_count" in profile && (
            <>
              <div className="border-2 border-primary bg-surface dark:bg-stone-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-display text-3xl font-bold block text-primary">{profile.followers_count}</span>
                <span className="font-label text-label-xs uppercase text-on-surface-variant font-bold block mt-1">{t("profile.followers")}</span>
              </div>
              <div className="border-2 border-primary bg-surface dark:bg-stone-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-display text-3xl font-bold block text-primary">{profile.following_count}</span>
                <span className="font-label text-label-xs uppercase text-on-surface-variant font-bold block mt-1">{t("profile.following")}</span>
              </div>
            </>
          )}
          {"current_streak" in profile && (
            <div className="border-2 border-primary bg-surface dark:bg-stone-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-display text-3xl font-bold block text-primary">🔥 {profile.current_streak}</span>
              <span className="font-label text-label-xs uppercase text-on-surface-variant font-bold block mt-1">{t("profile.currentStreak")}</span>
            </div>
          )}
          {"best_streak" in profile && (
            <div className="border-2 border-primary bg-surface dark:bg-stone-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-display text-3xl font-bold block text-primary">🏆 {profile.best_streak}</span>
              <span className="font-label text-label-xs uppercase text-on-surface-variant font-bold block mt-1">{t("profile.bestStreak")}</span>
            </div>
          )}
          {"stories_read_count" in profile && (
            <div className="border-2 border-primary bg-surface dark:bg-stone-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-display text-3xl font-bold block text-primary">📚 {profile.stories_read_count}</span>
              <span className="font-label text-label-xs uppercase text-on-surface-variant font-bold block mt-1">{t("profile.storiesRead")}</span>
            </div>
          )}
        </div>

        {/* Languages & levels tag-cloud */}
        <div className="border-2 border-primary bg-[#FAF8F5] dark:bg-stone-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-label text-label-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3">
            🗣️ {t("profile.languages")}
          </h3>
          {"languages" in profile && profile.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {profile.languages.map((lang) => (
                <span
                  key={lang.id}
                  className="flex items-center gap-2 border border-primary bg-surface dark:bg-stone-950 px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="font-body text-xs font-bold text-primary">{lang.language}</span>
                  {lang.level && <Badge level={lang.level} className="text-[9px] px-1.5 py-0.5 leading-none" />}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-body text-sm italic text-on-surface-variant">Hidden / No languages set</span>
          )}
        </div>
      </div>

      {/* 3. Achievements milestones list */}
      {"achievements" in profile && profile.achievements.length > 0 && (
        <div className="border-2 border-primary bg-[#FAF8F5] dark:bg-stone-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-headline text-headline-md mb-6 uppercase tracking-tight flex items-center gap-2 text-primary">
            <span>🏅</span>
            {t("profile.achievements")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.achievements.map((achievement, index) => {
              const style = getAchievementStyle(achievement, index);
              const translated = translateAchievement(achievement, lang);
              return (
                <div key={achievement.id} className={`p-4 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border border-primary relative ${style.cardClass}`}>
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
                      {achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Services Offered section */}
      <div className="border-2 border-primary bg-surface dark:bg-stone-950 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-headline text-headline-md mb-6 uppercase tracking-tight flex items-center gap-2 text-primary">
          <span>💼</span>
          {lookup("profile.services", "Services Offered")}
        </h2>
        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="border-2 border-primary p-5 bg-[#FAF8F5] dark:bg-stone-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-display text-body-lg font-bold text-primary leading-snug">{service.title}</h3>
                    <span className="bg-surface border border-primary font-label text-[9px] uppercase tracking-wider px-2 py-0.5 font-bold shrink-0">
                      {service.category}
                    </span>
                  </div>
                  <p className="font-body text-body-md text-on-surface-variant line-clamp-3 mb-4">{service.description}</p>
                </div>
                <div className="flex justify-between items-center border-t border-primary/20 pt-4 mt-auto">
                  <span className="font-display text-body-lg font-bold text-secondary">
                    {formatMoney(service.price)}
                  </span>
                  <Link
                    to={`/marketplace/services/${service.id}`}
                    className="bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors border-2 border-primary font-label text-label-xs uppercase tracking-wider px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {lookup("viewProfile", "Details")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-on-surface-variant italic">
            {lookup("profile.noServices", "No services provided yet.")}
          </p>
        )}
      </div>

      {/* 5. Published Books / Authored stories */}
      <div className="border-2 border-primary bg-surface dark:bg-stone-950 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-headline text-headline-md mb-6 uppercase tracking-tight flex items-center gap-2 text-primary">
          <span>📖</span>
          {lookup("profile.authoredStories", "Published Books")}
        </h2>
        {authoredStories && authoredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {authoredStories.map((story, i) => (
              <AcquisitionCard key={story.id} story={story} variant={i} />
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-on-surface-variant italic">
            {lookup("profile.noStories", "No books published yet.")}
          </p>
        )}
      </div>

    </div>
  );
}
