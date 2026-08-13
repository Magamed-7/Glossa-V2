import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import StoryBody from "../components/stories/StoryBody.jsx";
import StoryQuestions from "../components/stories/StoryQuestions.jsx";
import StoryAudioPlayer from "../components/stories/StoryAudioPlayer.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyProgress, getStory, getStories, saveProgress } from "../lib/api/stories.js";
import { useI18n, useT } from "../lib/i18n.jsx";
import { getBookCoverUrl } from "./StoriesCatalog.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import XpGainSummaryModal from "../components/ui/XpGainSummaryModal.jsx";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

export default function StoryReader() {
  const { id } = useParams();
  const t = useT();
  const { lang } = useI18n();
  const { languages } = useAuth();
  
  const rawLevel = languages?.find((l) => l.is_target)?.level || "A1";
  const targetLevel = rawLevel === "native" ? "C2" : rawLevel;

  const { data: story, loading, error, reload } = useApi(() => getStory(id, { locale: lang }), [id]);
  const { data: progressList } = useApi(() => getMyProgress(), []);
  const progress = progressList?.find((p) => p.story_id === Number(id));

  const { data: siblingStories } = useApi(
    () => story ? getStories({ level: story.cefr_level, limit: 100 }) : Promise.resolve(null),
    [story?.cefr_level]
  );

  const { currentNumber, totalCount, prevId, nextId } = (siblingStories && story) ? (() => {
    const idx = siblingStories.findIndex(s => s.id === story.id);
    if (idx === -1) return { currentNumber: 1, totalCount: 1, prevId: null, nextId: null };
    return {
      currentNumber: idx + 1,
      totalCount: siblingStories.length,
      prevId: idx > 0 ? siblingStories[idx - 1].id : null,
      nextId: idx < siblingStories.length - 1 ? siblingStories[idx + 1].id : null,
    };
  })() : { currentNumber: 1, totalCount: 12, prevId: null, nextId: null };

  const [completed, setCompleted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    setCompleted(!!progress?.is_completed);
  }, [progress]);

  useEffect(() => {
    if (!story || restoredRef.current) return;
    restoredRef.current = true;
    if (progress?.last_position) window.scrollTo({ top: progress.last_position });
  }, [story, progress]);

  useEffect(() => {
    if (!story) return undefined;

    let timeout;
    function onScroll() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveProgress(story.id, { last_position: Math.round(window.scrollY) }).catch(() => {});
      }, 2000);
    }

    window.addEventListener("scroll", onScroll);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
      saveProgress(story.id, { last_position: Math.round(window.scrollY) }).catch(() => {});
    };
  }, [story]);

  async function onToggleComplete() {
    const nextState = !completed;
    setCompleted(nextState);
    try {
      await saveProgress(story.id, { is_completed: nextState });
      if (nextState) {
        setShowXpModal(true);
      }
    } catch (e) {
      setCompleted(!nextState);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (story && story.cefr_level !== targetLevel) {
    return (
      <div className="max-w-md mx-auto my-24 border-[3px] border-on-surface bg-surface p-8 shadow-[8px_8px_0_0_#000] text-center neo-card flex flex-col items-center gap-6">
        <Icon name="lock" className="text-secondary text-5xl" />
        <h2 className="font-serif text-3xl font-black uppercase tracking-tight">{t("stories.levelLockedTitle")}</h2>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          {t("stories.levelLockedBody", { level: story.cefr_level, targetLevel })}
        </p>
        <Link
          to="/stories"
          className="bg-primary text-surface border-[2.5px] border-on-surface px-6 py-3 font-label text-xs uppercase font-bold tracking-widest shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
        >
          {t("stories.backToCatalog")}
        </Link>
      </div>
    );
  }

  const cover = getBookCoverUrl(story.id);
  const hasTranslation = !!story.body_translated;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body -mt-12">
      <header className="border-b-2 border-on-surface flex justify-between items-end pb-3 mb-10 mt-10">
        <div>
          <h1 className="font-headline text-3xl font-bold">{story.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-1 bg-primary"></div>
            <span className="font-label text-[10px] text-on-surface-variant tracking-widest uppercase">
              {t("stories.storyCounter", { n: currentNumber, total: totalCount })}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative pb-24">
        {/* Hero Image */}
        <div className="relative w-full aspect-[2/1] border-[3px] border-on-surface shadow-[6px_6px_0_0_#000] mb-8 overflow-hidden bg-surface-variant">
          <img
            className="w-full h-full object-cover"
            src={cover}
            alt={story.title}
            aria-hidden="true"
            loading="eager"
          />
          {/* Overlay text on image */}
          <div className="absolute bottom-6 left-6 z-10 text-white">
            <div className="bg-primary text-surface font-label text-[10px] uppercase tracking-widest px-2 py-1 inline-block font-bold mb-2">
              {t("stories.storyCounter", { n: currentNumber, total: totalCount })}
            </div>
            <h2 className="font-headline text-5xl font-bold drop-shadow-md">{story.title}</h2>
          </div>
          {/* subtle dark gradient at bottom for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Metadata Row */}
        <div className="flex justify-between items-center border-b-2 border-on-surface/20 pb-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-on-surface text-surface font-label text-xs font-bold px-2 py-1">
              {story.cefr_level || "A1"}
            </div>
            {story.genre && (
              <span className="font-label text-sm font-bold uppercase tracking-widest">{story.genre}</span>
            )}
            <StoryAudioPlayer storyId={story.id} hasAudio={!!story.audio_url} />
          </div>
          {hasTranslation && (
            <button
              onClick={() => setShowTranslation((v) => !v)}
              className="font-label text-xs font-bold uppercase text-primary hover:underline underline-offset-4 tracking-widest"
            >
              {t("stories.showTranslation")}
            </button>
          )}
        </div>

        {/* Title Area */}
        <div className="mb-10">
          <h1 className="font-headline text-5xl mb-2">{story.title}</h1>
          {story.title_translated && (
            <p className="font-headline text-lg italic text-on-surface-variant">{story.title_translated}</p>
          )}
        </div>

        {/* Story Body */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
          {showTranslation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <StoryBody body={story.body} words={story.words} wordDictionary={story.word_dictionary} storyId={story.id} level={story.cefr_level} />
              <div className="font-headline text-lg leading-[2.5] text-on-surface-variant border-l-2 border-on-surface/20 pl-6">
                {story.body_translated}
              </div>
            </div>
          ) : (
            <div className="font-headline text-xl leading-[2.5]">
              <StoryBody body={story.body} words={story.words} wordDictionary={story.word_dictionary} storyId={story.id} level={story.cefr_level} />
            </div>
          )}
        </div>

        <StoryQuestions
          storyId={story.id}
          questions={story.questions}
          locale={lang}
          onCompleted={() => setCompleted(true)}
        />

        {/* Footer actions */}
        <div className="mt-16 pt-10 border-t border-on-surface/30 flex justify-between items-center">
          <button
            onClick={onToggleComplete}
            className={`flex items-center gap-3 px-6 py-3 font-label text-xs uppercase font-bold tracking-widest border-[2px] border-on-surface shadow-[3px_3px_0_0_#000] transition-all hover:-translate-y-0.5 active:translate-y-0
              ${completed 
                ? "bg-[#e5dfd9] text-on-surface-variant shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[0px_0px_0_0_#000]" 
                : "bg-secondary text-surface hover:shadow-[5px_5px_0_0_#000] active:shadow-[1px_1px_0_0_#000]"
              }
            `}
          >
            <Icon name={completed ? "restart_alt" : "check_circle"} className="text-lg" />
            {completed ? t("stories.resetReadMark") : t("stories.markAsRead")}
          </button>

          <div className="flex items-center gap-4">
            <Link
              to={prevId ? `/stories/${prevId}` : `/stories?level=${story.cefr_level}`}
              className={`w-12 h-12 flex items-center justify-center border-[2px] border-on-surface shadow-[3px_3px_0_0_#000] bg-surface hover:bg-surface-variant transition-colors ${!prevId ? "opacity-35 cursor-not-allowed" : ""}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest">
              {t("stories.storyCounter", { n: currentNumber, total: totalCount })}
            </span>
            <Link
              to={nextId ? `/stories/${nextId}` : `/stories?level=${story.cefr_level}`}
              className={`flex items-center gap-3 h-12 px-6 border-[2px] border-on-surface shadow-[3px_3px_0_0_#000] bg-surface font-label text-xs uppercase font-bold tracking-widest hover:bg-surface-variant transition-colors ${!nextId ? "opacity-35 cursor-not-allowed" : ""}`}
            >
              {t("stories.nextStory")}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {hasTranslation && (
        <button
          onClick={() => setShowTranslation((v) => !v)}
          className="fixed bottom-8 right-8 bg-on-surface text-surface flex items-center gap-3 px-5 py-3 font-label text-[11px] font-bold uppercase tracking-widest border-[2px] border-on-surface shadow-[4px_4px_0_0_#C62340] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#C62340] transition-all z-50"
        >
          <Icon name="translate" className="text-lg" />
          {t("stories.translateView")}
        </button>
      )}

      <XpGainSummaryModal
        isOpen={showXpModal}
        onClose={() => setShowXpModal(false)}
        xpGained={10}
        correctCount={1}
        totalCount={1}
        gameType="story"
        lang={lang}
      />
    </div>
  );
}
