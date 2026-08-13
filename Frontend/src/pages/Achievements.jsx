import { useState } from "react";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getAllAchievements, getMyAchievements } from "../lib/api/achievements.js";
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

// Light-mode card gradients → Dark-mode equivalents (deep, saturated, readable)
const CARD_PALETTES = [
  {
    // Neutral grey
    light: "bg-gradient-to-br from-[#e5e2df] to-[#c8c5c2] text-black border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#2a2825] dark:to-[#1a1816] dark:text-stone-100 dark:border-stone-600",
    iconLight: "bg-black text-white",
    iconDark:  "dark:bg-stone-200 dark:text-stone-900",
  },
  {
    // Rose / crimson
    light: "bg-gradient-to-br from-[#ffd6e0] to-[#ffa3b1] text-secondary border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#4a0d1f] dark:to-[#2d0510] dark:text-rose-200 dark:border-rose-900",
    iconLight: "bg-secondary text-white",
    iconDark:  "dark:bg-rose-700 dark:text-white",
  },
  {
    // Amber / warm orange
    light: "bg-gradient-to-br from-[#ffe6cc] to-[#ffcc99] text-black border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#3d2000] dark:to-[#251200] dark:text-amber-200 dark:border-amber-900",
    iconLight: "bg-black text-white",
    iconDark:  "dark:bg-amber-700 dark:text-white",
  },
  {
    // Teal
    light: "bg-gradient-to-br from-[#d2f4ea] to-[#a3e4d7] text-teal-900 border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#042e26] dark:to-[#021a16] dark:text-teal-200 dark:border-teal-900",
    iconLight: "bg-teal-800 text-white",
    iconDark:  "dark:bg-teal-600 dark:text-white",
  },
];

// Special palettes for fixed achievement codes
const SPECIAL_PALETTES = {
  reviews_5: {
    light: "bg-gradient-to-br from-[#ca8a04] via-[#eab308] to-[#fef08a] text-black border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#3d2800] dark:to-[#1f1400] dark:text-yellow-200 dark:border-yellow-800",
    iconLight: "bg-black text-white font-display text-xl italic font-bold",
    iconDark:  "dark:bg-yellow-700 dark:text-white",
  },
  streak_1: {
    light: "bg-gradient-to-br from-[#dc2c4f] to-[#b90538] text-white border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#5a0a1e] dark:to-[#350310] dark:text-rose-100 dark:border-rose-800",
    iconLight: "bg-black text-white",
    iconDark:  "dark:bg-rose-900 dark:text-white",
  },
  streak_2: {
    light: "bg-gradient-to-br from-[#2c2c2c] to-[#000000] text-white border-2 border-primary",
    dark:  "dark:bg-gradient-to-br dark:from-[#111111] dark:to-[#000000] dark:text-stone-100 dark:border-stone-700",
    iconLight: "bg-white text-black",
    iconDark:  "dark:bg-stone-300 dark:text-black",
  },
};

const getAchievementStyle = (achievement, index) => {
  const { code, icon } = achievement;
  const resolved = resolveIcon(icon);
  const threshold = parseInt(code.split("_").pop(), 10) || 0;
  const isMax = threshold >= 10 || code.endsWith("_100") || code.endsWith("_500");

  // Special codes override palette
  if (SPECIAL_PALETTES[code]) {
    const sp = SPECIAL_PALETTES[code];
    let leftContent = null;
    if (code === "reviews_5" || code.startsWith("words_")) {
      leftContent = threshold.toString();
    } else if (code.startsWith("streak_")) {
      leftContent = <Icon name="local_fire_department" className="text-2xl filled" />;
    } else {
      leftContent = <Icon name={resolved} className="text-2xl" />;
    }
    return {
      cardClass: `${sp.light} ${sp.dark}`,
      leftBoxClass: `${sp.iconLight} ${sp.iconDark}`,
      leftContent,
      isMax,
    };
  }

  // Cyclic palette
  const palette = CARD_PALETTES[index % 4];
  let leftContent = null;
  if (code === "reviews_5" || code.startsWith("words_")) {
    leftContent = threshold.toString();
  } else if (code.startsWith("streak_")) {
    leftContent = <Icon name="local_fire_department" className="text-2xl filled" />;
  } else {
    leftContent = <Icon name={resolved} className="text-2xl" />;
  }

  return {
    cardClass: `${palette.light} ${palette.dark}`,
    leftBoxClass: `${palette.iconLight} ${palette.iconDark}`,
    leftContent,
    isMax,
  };
};

export default function Achievements() {
  const t = useT();
  const { lang } = useI18n();
  const [filter, setFilter] = useState("all"); // "all" or "earned"

  const { data, loading, error, reload } = useApi(async () => {
    const [all, mine] = await Promise.all([getAllAchievements(), getMyAchievements()]);
    return { all, mine };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Skeleton className="h-24 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const earnedByCode = new Map(data.mine.map((a) => [a.code, a]));
  const earnedCount = data.mine.length;
  const totalCount = data.all.length;

  // Compute 7 levels of prestige based on earned achievements count
  let prestigeKey = "prestigeBronze"; // Level 1 (0+ earned)
  if (earnedCount >= 100) prestigeKey = "prestigeLegendary"; // Level 7
  else if (earnedCount >= 70) prestigeKey = "prestigeMaster"; // Level 6
  else if (earnedCount >= 40) prestigeKey = "prestigeDiamond"; // Level 5
  else if (earnedCount >= 20) prestigeKey = "prestigePlatinum"; // Level 4
  else if (earnedCount >= 10) prestigeKey = "prestigeGold"; // Level 3
  else if (earnedCount >= 5) prestigeKey = "prestigeSilver"; // Level 2

  // Group achievements by category for the Registry view
  const groups = new Map();
  data.all.forEach((a) => {
    if (!groups.has(a.category)) groups.set(a.category, []);
    groups.get(a.category).push(a);
  });

  const getLeftBorderClass = (category) => {
    switch (category) {
      case "grinder":  return "border-l-8 border-green-600 dark:border-green-700";
      case "learner":  return "border-l-8 border-secondary dark:border-rose-700";
      case "social":   return "border-l-8 border-mustard dark:border-yellow-600";
      case "teacher":  return "border-l-8 border-blue-600 dark:border-blue-700";
      default:         return "border-l-8 border-tertiary dark:border-stone-600";
    }
  };

  // Light-mode soft pastel + dark-mode deep bg
  const getSoftGradientClass = (category) => {
    switch (category) {
      case "grinder":
        return "bg-gradient-to-r from-[#e6f4ea] to-[#f0f9f4] dark:bg-none dark:bg-stone-900/80";
      case "learner":
        return "bg-gradient-to-r from-[#fce8e6] to-[#fdf2f0] dark:bg-none dark:bg-stone-900/80";
      case "social":
        return "bg-gradient-to-r from-[#e8f0fe] to-[#f1f3f4] dark:bg-none dark:bg-stone-900/80";
      case "teacher":
        return "bg-gradient-to-r from-[#fef7e0] to-[#fffbf0] dark:bg-none dark:bg-stone-900/80";
      default:
        return "bg-gradient-to-r from-[#f5f5f4] to-[#f5f2eb] dark:bg-none dark:bg-stone-900/80";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-double border-primary dark:border-rose-900 pb-6">
        <div>
          <h1 className="font-headline text-headline-lg uppercase tracking-tight leading-none text-secondary dark:text-rose-400">
            {filter === "all" ? t("achievements.registryTitle") : t("achievements.hallOfFame")}
          </h1>
          <p className="font-body text-sm text-on-surface-variant dark:text-stone-400 mt-2 max-w-xl">
            {filter === "all" ? t("achievements.registrySubtitle") : t("achievements.hallOfFameSubtitle")}
          </p>
        </div>

        {/* Stats cards container */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Total earned block */}
          <div className="border-b-4 border-primary dark:border-rose-800 pb-1 flex flex-col justify-end min-w-[120px]">
            <span className="font-label text-[10px] text-on-surface-variant dark:text-stone-500 uppercase tracking-widest font-bold">
              {t("achievements.totalEarned")}
            </span>
            <span className="font-ledger text-3xl font-black mt-1 text-primary dark:text-rose-400">
              {earnedCount}/{totalCount}
            </span>
          </div>

          {/* Prestige block */}
          <div className="border-2 border-primary dark:border-rose-800 bg-secondary dark:bg-rose-950 text-on-secondary dark:text-rose-200 px-5 py-2.5 flex flex-col items-center justify-center hard-shadow min-w-[150px]">
            <span className="font-label text-[9px] uppercase tracking-widest font-bold opacity-90 leading-none">
              {t("achievements.prestigeTitle")}
            </span>
            <span className="font-headline text-xl uppercase tracking-tight mt-1 leading-none font-bold">
              {t(`achievements.${prestigeKey}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex justify-end mb-8">
        <div className="border-2 border-primary dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#3a3a3a] overflow-hidden">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-label text-xs uppercase tracking-wider font-bold transition-colors ${
              filter === "all"
                ? "bg-black dark:bg-stone-100 text-white dark:text-black"
                : "bg-white dark:bg-stone-900 text-black dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            {t("achievements.all")}
          </button>
          <div className="w-[2px] h-6 bg-primary dark:bg-stone-700" />
          <button
            onClick={() => setFilter("earned")}
            className={`px-4 py-2 font-label text-xs uppercase tracking-wider font-bold transition-colors ${
              filter === "earned"
                ? "bg-black dark:bg-stone-100 text-white dark:text-black"
                : "bg-white dark:bg-stone-900 text-black dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            {t("achievements.earnedOnly")}
          </button>
        </div>
      </div>

      {/* Conditional Layout Content */}
      {filter === "earned" ? (
        /* Hall of Fame view: Grid of Dynamic Gradient Cards */
        <div>
          <h2 className="font-headline text-headline-md mb-6 text-on-surface dark:text-stone-100 uppercase tracking-tight flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            {t("achievements.eyebrow")}
          </h2>
          {data.mine.length === 0 ? (
            <div className="border-2 border-primary dark:border-stone-700 bg-surface dark:bg-stone-900 p-8 text-center hard-shadow">
              <p className="font-body text-sm text-on-surface-variant dark:text-stone-400 italic">
                {t("achievements.emptyTitle") || "You haven't earned any achievements yet. Keep studying!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {data.mine.map((a, index) => {
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
          )}
        </div>
      ) : (
        /* Registry of Achievements view: Categories with rows */
        Array.from(groups.entries()).map(([category, items]) => {
          if (items.length === 0) return null;
          const categoryLabel = t(`achievements.categories.${category}`) || category;

          return (
            <div key={category} className="mb-10">
              {/* Category header */}
              <div className="flex items-center mb-6">
                <div className="border-2 border-primary dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-stone-100 px-4 py-1.5 font-label text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#3a3a3a] flex-shrink-0">
                  {categoryLabel}
                </div>
                <div className="flex-grow border-t-2 border-primary dark:border-stone-700 ml-4" />
              </div>

              {/* Achievements row container */}
              <div className="border-2 border-primary dark:border-stone-700 bg-surface dark:bg-stone-950 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#3a3a3a] divide-y-2 divide-primary dark:divide-stone-700">
                {items.map((a) => {
                  const earned = earnedByCode.get(a.code);
                  const resolvedIcon = resolveIcon(a.icon);
                  const translated = translateAchievement(a, lang);

                  if (earned) {
                    return (
                      <div
                        key={a.id}
                        className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors relative ${getLeftBorderClass(a.category)} ${getSoftGradientClass(a.category)}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-black dark:bg-stone-100 border-2 border-black dark:border-stone-600 flex items-center justify-center flex-shrink-0 text-white dark:text-stone-900">
                            <Icon name={resolvedIcon} className="text-2xl" />
                          </div>
                          <div>
                            <h3 className="font-headline text-lg font-bold text-on-surface dark:text-stone-100 uppercase tracking-tight">
                              {translated.title}
                            </h3>
                            <p className="font-body text-xs text-on-surface-variant dark:text-stone-400 mt-1 max-w-xl">
                              {translated.description}
                            </p>
                          </div>
                        </div>

                        {/* Right-hand earned metadata */}
                        <div className="flex flex-col items-end justify-between h-full min-h-[48px] md:self-stretch flex-shrink-0">
                          <span className="bg-secondary dark:bg-rose-800 text-on-secondary dark:text-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm tracking-wider">
                            EARNED
                          </span>
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="font-ledger text-[10px] text-on-surface-variant dark:text-stone-500">
                              ACHIEVED {new Date(earned.earned_at).toLocaleDateString()}
                            </span>
                            <Icon name="check_circle" className="text-secondary dark:text-rose-500 text-base" />
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={a.id}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#f6f3f0] dark:bg-stone-900/60 opacity-60 dark:opacity-50 relative overflow-hidden select-none border-l-8 border-outline-variant dark:border-stone-700"
                      >
                        {/* SEALED Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.06]">
                          <span className="font-headline text-7xl uppercase tracking-widest font-black rotate-12 text-black dark:text-stone-300">
                            SEALED
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#c0b9b3] dark:bg-stone-700 border-2 border-[#a89e96] dark:border-stone-600 flex items-center justify-center flex-shrink-0 text-white">
                            <Icon name={resolvedIcon} className="text-2xl" />
                          </div>
                          <div>
                            <h3 className="font-headline text-lg font-bold text-on-surface/80 dark:text-stone-400 uppercase tracking-tight">
                              {translated.title}
                            </h3>
                            <p className="font-body text-xs text-on-surface-variant/80 dark:text-stone-500 mt-1 max-w-xl">
                              {translated.description}
                            </p>
                          </div>
                        </div>

                        {/* Right-hand lock */}
                        <div className="flex flex-col items-end justify-between h-full min-h-[48px] md:self-stretch flex-shrink-0">
                          <Icon name="lock" className="text-on-surface-variant dark:text-stone-600 opacity-70 text-lg" />
                          <span className="font-ledger text-[10px] text-on-surface-variant/80 dark:text-stone-600 mt-auto uppercase tracking-wide">
                            PENDING CONDITIONS
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
