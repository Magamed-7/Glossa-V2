import { useMemo, useState } from "react";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import AcquisitionCard from "../components/market/AcquisitionCard.jsx";
import CommunityGrid from "../components/market/CommunityGrid.jsx";
import { useApi } from "../lib/useApi.js";
import { getUserStories } from "../lib/api/userStories.js";
import { useT } from "../lib/i18n.jsx";

const LEVEL_GROUPS = {
  ALL: null,
  "A1-A2": ["A1", "A2"],
  "B1-B2": ["B1", "B2"],
  "C1-C2": ["C1", "C2"],
};

const TOP_PICKS_COUNT = 3;

export default function MarketplaceStories() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [levelGroup, setLevelGroup] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState("ALL"); // 'ALL' | 'FREE' | 'PAID'

  const { data: stories, loading } = useApi(() => getUserStories({ limit: 100 }), []);

  const filtered = useMemo(() => {
    if (!stories) return [];
    let items = stories;

    const levels = LEVEL_GROUPS[levelGroup];
    if (levels) items = items.filter((s) => levels.includes(s.cefr_level));

    if (priceFilter === "FREE") items = items.filter((s) => !s.price);
    if (priceFilter === "PAID") items = items.filter((s) => !!s.price);

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter((s) => s.title.toLowerCase().includes(term));
    }

    return items;
  }, [stories, levelGroup, priceFilter, search]);

  const topPicks = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
      .slice(0, TOP_PICKS_COUNT);
  }, [filtered]);

  const topPickIds = useMemo(() => new Set(topPicks.map((s) => s.id)), [topPicks]);
  const rest = useMemo(() => filtered.filter((s) => !topPickIds.has(s.id)), [filtered, topPickIds]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("market.searchStoriesPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-700 text-black dark:text-stone-100 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#E32652]"
        />
        <Icon name="search" className="absolute left-3.5 top-3 text-gray-400 dark:text-stone-500" />
      </div>

      {/* Header */}
      <div>
        <p className="text-sm text-gray-600 dark:text-stone-400 font-sans">
          {t("market.storiesEyebrow")}
        </p>
        <p className="text-sm text-gray-500 dark:text-stone-500 font-sans mt-1 max-w-xl leading-relaxed">
          {t("market.storiesSubtitle")}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
            {t("market.level")}
          </span>
          <div className="flex gap-1.5">
            {Object.keys(LEVEL_GROUPS).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelGroup(lvl)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] transition-all ${
                  levelGroup === lvl
                    ? "bg-[#E32652] text-white -translate-y-0.5"
                    : "bg-white dark:bg-stone-900 text-black dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {lvl === "ALL" ? t("market.allLevels") : lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
            {t("market.price")}
          </span>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200 focus:outline-none"
          >
            <option value="ALL">{t("market.allPrices")}</option>
            <option value="FREE">{t("market.priceFree")}</option>
            <option value="PAID">{t("market.pricePaid")}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="aspect-[4/5]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-stone-900 border-2 border-dashed border-black dark:border-stone-800 text-center">
          <Icon name="auto_stories" className="text-4xl text-gray-400 dark:text-stone-500 mb-2" />
          <p className="text-sm font-bold text-black dark:text-stone-200 uppercase tracking-wide">
            {t("market.noListings")}
          </p>
        </div>
      ) : (
        <>
          {topPicks.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="font-serif font-black text-xl text-black dark:text-stone-100 whitespace-nowrap">
                  {t("market.topPicks")}
                </h2>
                <div className="h-px bg-black dark:bg-stone-700 flex-1" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {topPicks.map((story) => (
                  <AcquisitionCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          )}

          <CommunityGrid stories={rest} />
        </>
      )}
    </div>
  );
}
