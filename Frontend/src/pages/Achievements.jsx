import { useState } from "react";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getAllAchievements, getMyAchievements } from "../lib/api/achievements.js";
import { useT } from "../lib/i18n.jsx";

export default function Achievements() {
  const t = useT();
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

  // Compute prestige level
  let prestigeKey = "prestigeBronze";
  if (earnedCount >= 40) prestigeKey = "prestigePlatinum";
  else if (earnedCount >= 20) prestigeKey = "prestigeGold";
  else if (earnedCount >= 10) prestigeKey = "prestigeSilver";

  // Group achievements by category
  const groups = new Map();
  data.all.forEach((a) => {
    const isEarned = earnedByCode.has(a.code);
    if (filter === "earned" && !isEarned) return;

    if (!groups.has(a.category)) groups.set(a.category, []);
    groups.get(a.category).push(a);
  });

  const getLeftBorderClass = (category) => {
    switch (category) {
      case "grinder":
        return "border-l-8 border-green-600";
      case "learner":
        return "border-l-8 border-secondary";
      case "social":
        return "border-l-8 border-mustard";
      case "teacher":
        return "border-l-8 border-blue-600";
      default:
        return "border-l-8 border-tertiary";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Header section with Stats side-by-side */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-double border-primary pb-6">
        <div>
          <h1 className="font-headline text-headline-lg uppercase tracking-tight leading-none text-secondary">
            {t("achievements.registryTitle")}
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 max-w-xl">
            {t("achievements.registrySubtitle")}
          </p>
        </div>

        {/* Stats cards container */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Total earned block */}
          <div className="border-b-4 border-primary pb-1 flex flex-col justify-end min-w-[120px]">
            <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              {t("achievements.totalEarned")}
            </span>
            <span className="font-ledger text-3xl font-black mt-1 text-primary">
              {earnedCount}/{totalCount}
            </span>
          </div>

          {/* Prestige block */}
          <div className="border-2 border-primary bg-secondary text-on-secondary px-5 py-2.5 flex flex-col items-center justify-center hard-shadow min-w-[150px]">
            <span className="font-label text-[9px] uppercase tracking-widest font-bold opacity-90 leading-none">
              {t("achievements.prestigeTitle")}
            </span>
            <span className="font-headline text-xl uppercase tracking-tight mt-1 leading-none font-bold">
              {t(`achievements.${prestigeKey}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and navigation actions */}
      <div className="flex justify-end mb-8">
        <div className="border-2 border-primary bg-white flex items-center shadow-[3px_3px_0_px_#000] overflow-hidden">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-label text-xs uppercase tracking-wider font-bold transition-colors ${
              filter === "all" ? "bg-black text-white" : "bg-white text-black hover:bg-surface-container-low"
            }`}
          >
            {t("achievements.all")}
          </button>
          <div className="w-[2px] h-6 bg-primary" />
          <button
            onClick={() => setFilter("earned")}
            className={`px-4 py-2 font-label text-xs uppercase tracking-wider font-bold transition-colors ${
              filter === "earned" ? "bg-black text-white" : "bg-white text-black hover:bg-surface-container-low"
            }`}
          >
            {t("achievements.earnedOnly")}
          </button>
        </div>
      </div>

      {/* Categories stack */}
      {Array.from(groups.entries()).map(([category, items]) => {
        if (items.length === 0) return null;
        const categoryLabel = t(`achievements.categories.${category}`) || category;

        return (
          <div key={category} className="mb-10">
            {/* Category header box */}
            <div className="flex items-center mb-6">
              <div className="border-2 border-primary bg-white text-black px-4 py-1.5 font-label text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0_px_#000] flex-shrink-0">
                {categoryLabel}
              </div>
              <div className="flex-grow border-t-2 border-primary ml-4" />
            </div>

            {/* Achievements row container */}
            <div className="border-2 border-primary bg-surface shadow-[4px_4px_0_px_#000] divide-y-2 divide-primary">
              {items.map((a) => {
                const earned = earnedByCode.get(a.code);

                if (earned) {
                  return (
                    <div
                      key={a.id}
                      className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#f0f9f4] transition-colors relative ${getLeftBorderClass(
                        a.category
                      )}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center flex-shrink-0 text-white">
                          <Icon name={a.icon || "military_tech"} className="text-2xl" />
                        </div>
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface uppercase tracking-tight">
                            {a.title}
                          </h3>
                          <p className="font-body text-xs text-on-surface-variant mt-1 max-w-xl">
                            {a.description}
                          </p>
                        </div>
                      </div>

                      {/* Right-hand metadata */}
                      <div className="flex flex-col items-end justify-between h-full min-h-[48px] md:self-stretch flex-shrink-0">
                        <span className="bg-secondary text-on-secondary px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm tracking-wider">
                          EARNED
                        </span>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="font-ledger text-[10px] text-on-surface-variant">
                            ACHIEVED {new Date(earned.earned_at).toLocaleDateString()}
                          </span>
                          <Icon name="check_circle" className="text-secondary text-base" />
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={a.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#f6f3f0] opacity-60 relative overflow-hidden select-none border-l-8 border-outline-variant"
                    >
                      {/* SEALED Watermark background */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <span className="font-headline text-7xl uppercase tracking-widest font-black rotate-12">
                          SEALED
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#c0b9b3] border-2 border-[#a89e96] flex items-center justify-center flex-shrink-0 text-white">
                          <Icon name={a.icon || "lock"} className="text-2xl" />
                        </div>
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface/80 uppercase tracking-tight">
                            {a.title}
                          </h3>
                          <p className="font-body text-xs text-on-surface-variant/80 mt-1 max-w-xl">
                            {a.description}
                          </p>
                        </div>
                      </div>

                      {/* Right-hand lock status */}
                      <div className="flex flex-col items-end justify-between h-full min-h-[48px] md:self-stretch flex-shrink-0">
                        <Icon name="lock" className="text-on-surface-variant opacity-70 text-lg" />
                        <span className="font-ledger text-[10px] text-on-surface-variant/80 mt-auto uppercase tracking-wide">
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
      })}
    </div>
  );
}
