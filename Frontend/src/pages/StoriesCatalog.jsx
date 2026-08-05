import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyProgress, getStories } from "../lib/api/stories.js";
import { useT, useI18n } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useToast } from "../lib/toast.jsx";

export function getBookCoverUrl(storyId) {
  const COLOR_COVERS = [
    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600", // Retro Rocket
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600", // Vintage Library
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600", // Vintage Books
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600", // Retro Cafe
    "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600", // Retro type
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600", // Old stack of books
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600", // Tower Bridge painting
    "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600", // Dark alley mysterious
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600", // Cyberpunk neon globe
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600", // Vintage theater
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600", // Business/office vintage
    "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600"  // Retro artistic shape
  ];
  return COLOR_COVERS[storyId % COLOR_COVERS.length];
}

const GENRE_IMAGE_MAP = {
  "feel-good": "/img/textures/misty-lake.webp",
  "comedy": "/img/textures/typewriter-g.webp",
  "family drama": "/img/textures/artifacts-desk.webp",
  "adventure": "/img/textures/vintage-map.webp",
  "slice of life": "/img/textures/london-noir.webp",
  "mystery": "/img/textures/tape-reel.webp",
  "drama": "/img/textures/brutalist-stairs.webp",
  "funny-mistake": "/img/textures/gramophone.webp",
  "motivating": "/img/textures/linguistic-blueprint.webp",
  "absurd-coincidence": "/img/textures/underwater-light.webp"
};

function getGenreImage(genre) {
  const norm = genre?.toLowerCase().trim();
  return GENRE_IMAGE_MAP[norm] || "/img/textures/vintage-map.webp";
}

function BookCover({ story, isCompleted, progress }) {
  const coverUrl = getBookCoverUrl(story.id);
  const t = useT();
  
  return (
    <div className="relative w-full aspect-[3/4] border-[3px] border-on-surface shadow-[4px_4px_0_0_#000] overflow-hidden bg-surface transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:translate-x-1 group-hover:shadow-[7px_7px_0_0_#000]">
      {/* Colorful Background cover image */}
      <img
        src={coverUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Solid black gradient overlay at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45 z-10"></div>

      {/* Editorial elements */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-20 text-white">
        {/* Spine lines */}
        <div className="border-b border-white/20 pb-1.5 flex justify-between items-center text-[7px] font-mono tracking-widest uppercase opacity-85 font-bold">
          <span>GLOSSA EDITION</span>
          <span>NO. {story.id + 100}</span>
        </div>

        {/* Vintage Paper sticker label for the title */}
        <div className="my-auto bg-[#fcfbf9] text-on-surface border-[2.5px] border-on-surface shadow-[3px_3px_0_0_#000] p-3 text-center rotate-[-1deg] transition-all duration-500 group-hover:rotate-[1deg] group-hover:scale-105">
          <h4 className="font-headline text-sm font-bold uppercase tracking-tight leading-tight">
            {story.title}
          </h4>
          <div className="w-6 h-[1.5px] bg-on-surface/20 mx-auto my-1.5"></div>
          <p className="font-label text-[7px] uppercase tracking-wider text-on-surface-variant font-black">
            {story.genre || "GENERAL"}
          </p>
        </div>

        {/* Bottom spine info */}
        <div className="border-t border-white/20 pt-1.5 flex justify-between items-center text-[7px] font-mono tracking-widest uppercase opacity-85 font-bold">
          <span>{story.cefr_level}</span>
          <span>{story.words?.length || 80} WORDS</span>
        </div>
      </div>

      {/* IN PROGRESS flag */}
      {progress && !isCompleted && (
        <span className="absolute top-3 left-3 bg-[#e5dfd9] text-on-surface text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border-[2px] border-on-surface z-35 shadow-[1px_1px_0_0_#000] font-mono font-bold">
          {t("stories.reading").toUpperCase()}
        </span>
      )}

      {/* COMPLETED Stamp */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none z-35">
          <div className="border-[3px] border-secondary text-secondary font-black tracking-wider uppercase px-4 py-1.5 rounded rotate-[-12deg] shadow-lg bg-[#fcfbf9] text-base font-mono">
            {t("stories.completed").toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

const LEVEL_LABELS = {
  en: { A1: "BEGINNER", A2: "ELEMENTARY", B1: "INTERMEDIATE", B2: "UPPER-INT", C1: "ADVANCED", C2: "MASTERY" },
  ru: { A1: "НАЧИНАЮЩИЙ", A2: "ЭЛЕМЕНТАРНЫЙ", B1: "СРЕДНИЙ", B2: "ВЫШЕ СРЕДНЕГО", C1: "ПРОДВИНУТЫЙ", C2: "ВЛАДЕНИЕ" },
  tg: { A1: "ИБТИДОӢ", A2: "ОДДӢ", B1: "МИЁНА", B2: "АЗ МИЁНА БОЛО", C1: "ПЕШРАФТА", C2: "ОЛИӢ" }
};

export default function StoriesCatalog() {
  const t = useT();
  const { lang } = useI18n();
  const toast = useToast();
  const { languages } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const rawLevel = languages?.find((l) => l.is_target)?.level || "A1";
  const targetLevel = rawLevel === "native" ? "C2" : rawLevel;
  
  const level = searchParams.get("level") || targetLevel;
  const activeGenre = searchParams.get("genre") || "";
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'progress' | 'completed'

  // Interactive mock states
  const [topicRequest, setTopicRequest] = useState("");
  const [topicFeedback, setTopicFeedback] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFeedback, setNewsletterFeedback] = useState(null);
  const [loadMoreCount, setLoadMoreCount] = useState(6);

  const { data: stories, loading } = useApi(
    () => getStories({ level: level || undefined, limit: 120 }),
    [level]
  );
  
  const { data: progressList } = useApi(() => getMyProgress(), []);
  
  const progressMap = useMemo(() => {
    return new Map((progressList || []).map((p) => [p.story_id, p]));
  }, [progressList]);

  const completedStoryIds = useMemo(() => {
    return new Set(
      (progressList || [])
        .filter((p) => p.is_completed)
        .map((p) => p.story_id)
    );
  }, [progressList]);

  // Extract actually available genres for stories of this level dynamically
  const availableGenres = useMemo(() => {
    if (!stories) return [];
    const set = new Set();
    stories.forEach((s) => {
      if (s.genre) set.add(s.genre.trim().toLowerCase());
    });
    return Array.from(set).sort();
  }, [stories]);

  const LEVEL_TABS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Helper for level subtitle mapping
  const levelText = LEVEL_LABELS[lang] || LEVEL_LABELS.en;

  function onLevelChange(newLevel) {
    const next = new URLSearchParams(searchParams);
    next.set("level", newLevel);
    next.delete("genre"); // Reset genre on level change
    setSearchParams(next);
    setFilterTab("all");
  }

  function onGenreChange(genreVal) {
    const next = new URLSearchParams(searchParams);
    if (genreVal) {
      next.set("genre", genreVal);
    } else {
      next.delete("genre");
    }
    setSearchParams(next);
    setFilterTab("all");
  }

  // Filtered stories depending on level, activeGenre, and filterTab
  const filteredStories = useMemo(() => {
    if (!stories) return [];
    let items = stories;
    
    // 1. Filter by active genre if selected
    if (activeGenre) {
      items = items.filter(s => s.genre?.toLowerCase() === activeGenre.toLowerCase());
    }

    // 2. Filter by status tabs (All, In Progress, Completed)
    if (filterTab === "progress") {
      items = items.filter(s => progressMap.has(s.id) && !completedStoryIds.has(s.id));
    } else if (filterTab === "completed") {
      items = items.filter(s => completedStoryIds.has(s.id));
    }

    return items;
  }, [stories, activeGenre, filterTab, progressMap, completedStoryIds]);

  function handleRequestSubmit(e) {
    e.preventDefault();
    if (!topicRequest.trim()) return;
    setTopicFeedback("Topic suggestion sent! Thank you for curating Glossa.");
    setTopicRequest("");
    setTimeout(() => setTopicFeedback(null), 4000);
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterFeedback("Subscribed! Check your Manor mailbox on Sunday.");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterFeedback(null), 4000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-[#fcfbf9] text-on-surface min-h-screen">
      {/* Genre Archives View (Detailed Genre view if activeGenre selected) */}
      {activeGenre ? (
        <div className="flex flex-col gap-8">
          {/* Header Banner */}
          <div className="border-[3px] border-on-surface shadow-[6px_6px_0_0_#000] bg-surface overflow-hidden relative">
            <div className="w-full aspect-[2.5/1] bg-on-surface relative">
              <img
                className="w-full h-full object-cover opacity-70 grayscale contrast-[1.2]"
                src={getGenreImage(activeGenre)}
                alt=""
              />
              <div className="absolute top-4 left-4 bg-secondary text-surface font-label text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border-[2px] border-on-surface">
                {t("stories.archiveLevel")}: {level}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-headline text-4xl font-bold uppercase tracking-tight">
                {activeGenre} Archives
              </h3>
              <p className="font-body text-xs text-on-surface-variant mt-2 leading-relaxed max-w-2xl">
                {t("stories.genreDesc").replace("{activeGenre}", activeGenre)}
              </p>
            </div>
            <button
              onClick={() => onGenreChange("")}
              className="absolute top-4 right-4 bg-[#fcfbf9] text-on-surface border-[2.5px] border-on-surface shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-[0px_0px_0_0_#000] px-4 py-1.5 font-label text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all"
            >
              {t("stories.backToCatalog")}
            </button>
          </div>

          {/* Reading List Tabs and Grid */}
          <div>
            <div className="flex justify-between items-center border-b-2 border-on-surface pb-3 mb-6">
              <h3 className="font-headline text-2xl font-bold font-headline">{t("stories.bookCatalog")}</h3>
              <div className="flex gap-4 font-label text-[10px] uppercase font-bold text-on-surface-variant">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`cursor-pointer ${filterTab === "all" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.allBooks")}
                </button>
                <button
                  onClick={() => setFilterTab("progress")}
                  className={`cursor-pointer ${filterTab === "progress" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.inProgress")}
                </button>
                <button
                  onClick={() => setFilterTab("completed")}
                  className={`cursor-pointer ${filterTab === "completed" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.completed")}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4]" />
                ))}
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="border-[3px] border-dashed border-on-surface p-12 text-center flex flex-col gap-3 items-center bg-surface/30">
                <Icon name="auto_stories" className="text-4xl text-on-surface-variant/40" />
                <h4 className="font-headline text-lg font-bold">{t("stories.emptyLevelTitle")}</h4>
                <p className="font-body text-xs text-on-surface-variant max-w-md">
                  There are currently no stories loaded for the chosen filter tab inside level {level}.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {filteredStories.slice(0, loadMoreCount).map((story) => {
                    const prog = progressMap.get(story.id);
                    const isComp = completedStoryIds.has(story.id);
                    return (
                      <Link key={story.id} to={`/stories/${story.id}`} className="group block">
                        <BookCover story={story} isCompleted={isComp} progress={prog} />
                        <div className="mt-3">
                          <h4 className="font-headline text-base font-bold group-hover:underline underline-offset-4 leading-tight">
                            {story.title}
                          </h4>
                          <p className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant mt-1 font-bold">
                            LEVEL {story.cefr_level} • {isComp ? t("stories.completed").toUpperCase() : prog?.last_position ? t("stories.reading").toUpperCase() : "10 MIN READ"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {filteredStories.length > loadMoreCount && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setLoadMoreCount(c => c + 6)}
                      className="px-6 py-2.5 border-[2px] border-on-surface shadow-[3px_3px_0_0_#000] bg-[#fcfbf9] font-label text-[10px] uppercase font-bold tracking-widest hover:bg-surface-variant transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      {t("stories.loadMore")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Main Catalog View (Top-to-Bottom Layout) */
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="border-b-[2px] border-on-surface pb-4">
            <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
              {t("stories.eyebrow").toUpperCase()}
            </span>
            <h2 className="font-headline text-4xl font-bold mt-1">{t("stories.readerLibrary")}</h2>
          </div>

          {/* Level Tabs */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {LEVEL_TABS.map((lvl) => {
              const isActive = level === lvl;
              const isLocked = lvl !== targetLevel;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    if (isLocked) {
                      toast.error(
                        lang === "ru"
                          ? `Этот уровень заблокирован. Ваш текущий уровень: ${targetLevel}`
                          : lang === "tg"
                            ? `Ин сатҳ маҳкам аст. Сатҳи ҷории шумо: ${targetLevel}`
                            : `This level is locked. Your current level is: ${targetLevel}`
                      );
                      return;
                    }
                    onLevelChange(lvl);
                  }}
                  className={`border-[2px] border-on-surface font-headline font-bold py-2.5 text-center transition-all select-none
                    ${isActive 
                      ? "bg-secondary text-surface shadow-[2px_2px_0_0_#000] -translate-x-[1px] -translate-y-[1px] cursor-pointer" 
                      : isLocked
                        ? "bg-[#e5dfd9] text-on-surface-variant opacity-60 cursor-not-allowed border-dashed"
                        : "bg-[#fcfbf9] text-on-surface shadow-[3px_3px_0_0_#000] hover:bg-surface-variant cursor-pointer"
                    }
                  `}
                >
                  <div className="text-base leading-tight flex items-center justify-center gap-1">
                    {isLocked && <Icon name="lock" className="text-xs" />}
                    <span>{lvl}</span>
                  </div>
                  <div className="text-[7px] uppercase tracking-wider font-label opacity-75 mt-0.5 font-bold">
                    {isLocked ? (lang === "ru" ? "ЗАКРЫТО" : lang === "tg" ? "МАҲКАМ" : "LOCKED") : levelText[lvl]}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="font-headline text-xs italic text-on-surface-variant -mt-6">
            {lang === "ru" ? "Текущий выбор:" : lang === "tg" ? "Интихоби ҷорӣ:" : "Currently curating for:"} {level === "A1" ? (lang === "ru" ? "Начинающий" : lang === "tg" ? "Ибтидоӣ" : "Beginner") : level === "A2" ? (lang === "ru" ? "Элементарный" : lang === "tg" ? "Оддӣ" : "Elementary") : level === "B1" ? (lang === "ru" ? "Средний" : lang === "tg" ? "Миёна" : "Intermediate") : level === "B2" ? (lang === "ru" ? "Выше среднего" : lang === "tg" ? "Аз миёна боло" : "Upper Intermediate") : level === "C1" ? (lang === "ru" ? "Продвинутый" : lang === "tg" ? "Пешрафта" : "Advanced") : (lang === "ru" ? "Владение" : lang === "tg" ? "Олиӣ" : "Mastery")} Level ({level})
          </p>

          {/* Choose a Genre Grid (Slightly larger photos - 3 columns on mobile, 4 columns on desktop) */}
          <div>
            <h3 className="font-headline text-xl font-bold mb-4 border-b-2 border-on-surface/10 pb-1">
              {t("stories.chooseGenre")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableGenres.map((g) => {
                return (
                  <button
                    key={g}
                    onClick={() => onGenreChange(g)}
                    className="group flex flex-col text-left border-[2px] border-on-surface shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] transition-all bg-surface overflow-hidden hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="w-full aspect-[4/3] border-b-2 border-on-surface overflow-hidden relative">
                      <img
                        className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.25] group-hover:grayscale-0 transition-all duration-300"
                        src={getGenreImage(g)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    </div>
                    <div className="py-2.5 px-3 font-label text-[10px] uppercase font-bold tracking-wider text-center w-full truncate">
                      {g}
                    </div>
                  </button>
                );
              })}

              {/* ALL GENRES */}
              <button
                onClick={() => {
                  window.location.href = `/stories?level=${level}`;
                }}
                className="group flex flex-col text-left border-[2px] border-on-surface shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] transition-all bg-surface overflow-hidden hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-full aspect-[4/3] border-b-2 border-on-surface flex flex-col items-center justify-center bg-[#eae4db]">
                  <span className="text-2xl font-headline tracking-widest font-bold text-on-surface/60">...</span>
                </div>
                <div className="py-2.5 px-3 font-label text-[10px] uppercase font-bold tracking-wider text-center w-full">
                  {t("stories.allGenres")}
                </div>
              </button>
            </div>
          </div>

          {/* Book List Grid: Show stories by filter tabs (All, In Progress, Completed) */}
          <div>
            <div className="flex justify-between items-center border-b-2 border-on-surface/10 pb-2 mb-4">
              <h3 className="font-headline text-xl font-bold">
                {t("stories.bookCatalog")} ({level} Collection)
              </h3>
              <div className="flex gap-4 font-label text-[10px] uppercase font-bold text-on-surface-variant">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`cursor-pointer ${filterTab === "all" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.allBooks")}
                </button>
                <button
                  onClick={() => setFilterTab("progress")}
                  className={`cursor-pointer ${filterTab === "progress" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.inProgress")}
                </button>
                <button
                  onClick={() => setFilterTab("completed")}
                  className={`cursor-pointer ${filterTab === "completed" ? "text-secondary border-b border-secondary pb-0.5 font-bold" : ""}`}
                >
                  {t("stories.completed")}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4]" />
                ))}
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="border-[2px] border-dashed border-on-surface p-12 text-center flex flex-col gap-3 items-center bg-surface/30">
                <Icon name="auto_stories" className="text-4xl text-on-surface-variant/40" />
                <h4 className="font-headline text-lg font-bold">{t("stories.emptyLevelTitle")}</h4>
                <p className="font-body text-xs text-on-surface-variant max-w-md">
                  There are currently no stories loaded for the selected filter tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {filteredStories.map((story) => {
                  const prog = progressMap.get(story.id);
                  const isComp = completedStoryIds.has(story.id);
                  return (
                    <Link key={story.id} to={`/stories/${story.id}`} className="group block">
                      <BookCover story={story} isCompleted={isComp} progress={prog} />
                      <div className="mt-3">
                        <h4 className="font-headline text-base font-bold group-hover:underline underline-offset-4 leading-tight">
                          {story.title}
                        </h4>
                        <p className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant mt-1 font-bold">
                          LEVEL {story.cefr_level} • {isComp ? t("stories.completed").toUpperCase() : prog?.last_position ? t("stories.reading").toUpperCase() : "10 MIN READ"}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {/* Request a Topic placed inside the grid as the last element */}
                <div className="border-[2px] border-dashed border-on-surface aspect-[3/4] p-5 flex flex-col gap-3 bg-surface/30 text-center items-center justify-center relative">
                  <div className="w-10 h-10 rounded-full border-2 border-on-surface flex items-center justify-center">
                    <span className="text-xl font-bold leading-none">+</span>
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-bold">{t("stories.requestTopic")}</h4>
                    <p className="font-body text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                      {t("stories.requestTopicSub").replace("{level}", level)}
                    </p>
                  </div>
                  <form onSubmit={handleRequestSubmit} className="w-full flex flex-col gap-2 mt-1 z-10">
                    <input
                      type="text"
                      value={topicRequest}
                      onChange={(e) => setTopicRequest(e.target.value)}
                      placeholder={t("stories.topicPlaceholder")}
                      className="w-full px-2 py-1.5 border-[2px] border-on-surface bg-surface text-[10px] shadow-[1.5px_1.5px_0_0_#000] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-on-surface text-surface text-[8px] font-bold uppercase tracking-widest py-1.5 hover:opacity-90 transition-opacity cursor-pointer border border-on-surface"
                    >
                      {t("stories.submitSuggestion")}
                    </button>
                  </form>
                  {topicFeedback && (
                    <p className="font-label text-[9px] text-secondary font-bold leading-tight mt-1">
                      {topicFeedback}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Dispatch Newsletter bottom block */}
          <div className="border-[2px] border-on-surface shadow-[4px_4px_0_0_#000] p-6 bg-[#f3ede4] flex flex-col gap-4 text-center items-center">
            <Icon name="mail" className="text-3xl text-secondary" />
            <div>
              <h4 className="font-headline text-lg font-bold">{t("stories.weeklyDispatch")}</h4>
              <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed max-w-lg">
                {t("stories.weeklyDispatchSub").replace("{level}", level)}
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-md">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t("stories.emailAddress")}
                required
                className="flex-1 px-3 py-2 border-[2px] border-on-surface bg-surface text-xs shadow-[2px_2px_0_0_#000] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-secondary text-surface text-[10px] font-bold uppercase tracking-widest px-6 py-2 hover:opacity-90 transition-opacity cursor-pointer border border-on-surface"
              >
                {t("stories.subscribe")}
              </button>
            </form>
            {newsletterFeedback && (
              <p className="font-label text-xs text-secondary font-bold leading-tight mt-1">
                {newsletterFeedback}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
