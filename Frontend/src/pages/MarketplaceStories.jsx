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
    <div className="space-y-section-gap">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("market.searchStoriesPlaceholder")}
          className="w-full pl-10 pr-4 py-2 border-2 border-primary bg-surface focus:outline-none focus:border-secondary transition-colors font-body text-body-md placeholder:text-on-surface-variant"
        />
      </div>

      {/* Header */}
      <section className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-tertiary-fixed rounded-full mix-blend-multiply opacity-50 blur-xl" />
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-4 relative z-10">
          {t("market.storiesEyebrow")}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl relative z-10">
          {t("market.storiesSubtitle")}
        </p>
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-primary pb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-label text-label-md text-on-surface-variant uppercase mr-2">{t("market.level")}</span>
          {Object.keys(LEVEL_GROUPS).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelGroup(lvl)}
              className={`px-4 py-1 border-2 border-primary font-label text-label-md uppercase transition-colors ${
                levelGroup === lvl
                  ? "bg-secondary text-on-secondary hard-shadow"
                  : "bg-surface hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {lvl === "ALL" ? t("market.allLevels") : lvl}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-label text-label-md text-on-surface-variant uppercase mr-2">{t("market.price")}</span>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="border-2 border-primary bg-surface px-4 py-2 font-label text-label-md focus:outline-none focus:border-secondary hard-shadow uppercase text-on-surface"
          >
            <option value="ALL">{t("market.allPrices")}</option>
            <option value="FREE">{t("market.priceFree")}</option>
            <option value="PAID">{t("market.pricePaid")}</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="aspect-[4/5]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-bright border-2 border-dashed border-primary text-center">
          <Icon name="auto_stories" className="text-4xl text-on-surface-variant mb-2" />
          <p className="font-label text-label-md text-on-surface uppercase">{t("market.noListings")}</p>
        </div>
      ) : (
        <>
          {topPicks.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-headline text-headline-md text-primary whitespace-nowrap">{t("market.topPicks")}</h2>
                <div className="flex-1 h-[2px] bg-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {topPicks.map((story, i) => (
                  <AcquisitionCard key={story.id} story={story} variant={i} />
                ))}
              </div>
            </section>
          )}

          <CommunityGrid stories={rest} />
        </>
      )}
    </div>
  );
}
