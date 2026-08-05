import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Flashcard from "../components/review/Flashcard.jsx";
import QualityButtons from "../components/review/QualityButtons.jsx";
import AudioButton from "../components/review/AudioButton.jsx";
import CardMeta from "../components/review/CardMeta.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../lib/toast.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getCards } from "../lib/api/deck.js";
import { getStats } from "../lib/api/learning.js";
import { submitReview } from "../lib/api/reviews.js";
import { useAppData } from "../lib/AppDataContext.jsx";
import { useT } from "../lib/i18n.jsx";
import { formatDate } from "../lib/format.js";

export default function SpacedRepetition() {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshStreak } = useAppData();
  const audioButtonRef = useRef(null);

  // Fetch all cards and learning stats
  const { data: cards, loading: loadingCards, error: errorCards, reload: reloadCards } = useApi(() => getCards({ limit: 150 }), []);
  const { data: stats, loading: loadingStats, error: errorStats, reload: reloadStats } = useApi(() => getStats(), []);

  const [activeReviewSession, setActiveReviewSession] = useState(null); // { queue: [...], index: 0, completed: 0, againCount: 0 }
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loading = loadingCards || loadingStats;
  const error = errorCards || errorStats;

  // Process cards list
  const now = new Date();
  const dueCards = [];
  const upcomingCards = [];

  if (cards) {
    cards.forEach((c) => {
      if (!c.next_review_date || new Date(c.next_review_date) <= now) {
        dueCards.push(c);
      } else {
        upcomingCards.push(c);
      }
    });
  }

  // Sort upcoming cards so those due soonest are first
  upcomingCards.sort((a, b) => new Date(a.next_review_date) - new Date(b.next_review_date));

  // Active card in the current session
  const sessionCard = activeReviewSession?.queue[activeReviewSession.index] || null;

  // Keydown listener for the active review session
  useEffect(() => {
    if (!activeReviewSession || !sessionCard) return;

    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;

      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "s" || e.key === "S") {
        audioButtonRef.current?.click();
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        const quality = { 1: 0, 2: 3, 3: 4, 4: 5 }[e.key];
        onAnswer(quality);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeReviewSession, sessionCard, flipped, submitting]);

  async function onAnswer(quality) {
    if (!sessionCard || submitting) return;
    setSubmitting(true);

    try {
      await submitReview(sessionCard.id, quality);
      
      const isLast = activeReviewSession.index + 1 >= activeReviewSession.queue.length;
      
      setActiveReviewSession(prev => ({
        ...prev,
        completed: prev.completed + 1,
        againCount: quality === 0 ? prev.againCount + 1 : prev.againCount,
        index: prev.index + 1
      }));

      setFlipped(false);
      
      if (isLast) {
        toast.success(t("review.sessionCompleteTitle"));
        reloadCards();
        reloadStats();
        refreshStreak();
      }
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  const handleReviewSingleCard = (card) => {
    setActiveReviewSession({
      queue: [card],
      index: 0,
      completed: 0,
      againCount: 0
    });
    setFlipped(false);
  };

  const handleReviewAllDue = () => {
    if (dueCards.length === 0) return;
    setActiveReviewSession({
      queue: dueCards,
      index: 0,
      completed: 0,
      againCount: 0
    });
    setFlipped(false);
  };

  const handleCloseSession = () => {
    setActiveReviewSession(null);
    reloadCards();
    reloadStats();
  };

  const getDueLabel = (card) => {
    if (!card.next_review_date) return t("review.dueNow");
    
    const dueDate = new Date(card.next_review_date);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return t("review.dueNow");
    } else if (diffDays === 1) {
      return t("review.dueTomorrow");
    } else {
      return t("review.dueInDays", { n: diffDays });
    }
  };

  const getLeftIcon = (card) => {
    if (!card.next_review_date) return "warning";
    const dueDate = new Date(card.next_review_date);
    if (dueDate <= now) return "warning";
    
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "calendar_month";
    return "more_horiz";
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <ErrorState error={error} onRetry={() => { reloadCards(); reloadStats(); }} />
      </div>
    );
  }

  // Calculate mastery values
  const retentionRate = stats?.retention_rate !== undefined && stats.retention_rate !== 0 
    ? stats.retention_rate 
    : 100;
  const learnedCount = stats?.learned_count || 0;

  return (
    <div 
      className="min-h-screen text-[#1c1c1a] font-sans p-4 md:p-8 relative select-none"
      style={{
        backgroundColor: "#fcf9f6",
        backgroundImage: "linear-gradient(#e5e2df 1px, transparent 1px), linear-gradient(90deg, #e5e2df 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start gap-12 pt-6">
        
        {/* Left Column: Title & Stats Panel */}
        <div className="w-full md:w-[35%] flex flex-col gap-8">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-primary">
              {t("review.archivalTitle")}
            </h1>
            <p className="text-xs text-on-surface-variant font-mono uppercase tracking-wider mt-4 leading-relaxed">
              {t("review.archivalSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-[280px]">
            {/* Retained Knowledge Stat */}
            <div className="border-2 border-black bg-surface p-5 shadow-[4px_4px_0_0_#000] neo-card relative overflow-hidden">
              <span className="text-[#ba1a1a] text-[10px] font-mono tracking-widest font-bold uppercase block mb-1">
                {t("review.retainedKnowledge")}
              </span>
              <div className="font-serif text-3xl font-black">
                {retentionRate}% Mastery
              </div>
              <div className="w-full bg-[#f0edea] border border-black h-2.5 mt-3 overflow-hidden">
                <div className="bg-[#ba1a1a] h-full transition-all duration-500" style={{ width: `${retentionRate}%` }}></div>
              </div>
            </div>

            {/* Solidified Knowledge Stat */}
            <div className="border-2 border-black bg-surface p-5 shadow-[4px_4px_0_0_#000] neo-card">
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest font-bold uppercase mb-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>{t("review.solidified")}</span>
              </div>
              <div className="font-serif text-3xl font-black">
                {learnedCount} {t("review.deck")}
              </div>
              <p className="text-[10px] text-on-surface-variant font-mono mt-2 uppercase tracking-wide leading-tight">
                {t("review.solidifiedDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Active Cases Folder List */}
        <div className="w-full md:w-[65%] flex flex-col mt-10 md:mt-0">
          
          {/* Top Folder Tab Shape */}
          <div className="z-10 flex justify-between items-end max-w-lg">
            <div className="border-t-2 border-x-2 border-black bg-[#ffddb8] px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_-2px_0_0_rgba(0,0,0,0.15)] z-20">
              {t("review.activeCases")} ({dueCards.length + upcomingCards.length})
            </div>
            
            {dueCards.length > 0 && (
              <button
                onClick={handleReviewAllDue}
                className="bg-[#ffb054] hover:bg-[#ffa034] text-black border-2 border-black font-mono text-xs font-black uppercase px-4 py-2 shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer mb-1"
              >
                {t("review.reviewAllBtn")} ({dueCards.length})
              </button>
            )}
          </div>

          {/* Folder Body Container */}
          <div 
            className="w-full bg-[#ffddb8] border-2 border-black shadow-[6px_6px_0_0_#000] p-6 flex flex-col gap-6 relative min-h-[400px] z-10"
            style={{ backgroundImage: "radial-gradient(#e5a260 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          >
            {/* Scrollable list inside the folder to prevent page stretching */}
            <div className="max-h-[620px] overflow-y-auto pr-2 flex flex-col gap-6">
              
              {/* Due Cards (Active) */}
              {dueCards.map((c) => (
                <div key={c.id} className="flex gap-4 items-start">
                  
                  {/* Margin Badge Indicator */}
                  <div className="w-9 h-9 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_#000] flex-shrink-0 mt-3">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>

                  {/* Card Content */}
                  <div className="flex-grow bg-surface border-2 border-black p-5 shadow-[4px_4px_0_0_#000] relative neo-card">
                    {/* Retro Stamp */}
                    <div className="absolute top-4 right-4 bg-[#ffdadb] text-[#ba1a1a] border border-[#ba1a1a] px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider transform rotate-1 select-none">
                      {getDueLabel(c)}
                    </div>

                    <h3 className="font-serif text-2xl font-black text-[#1c1c1a] tracking-tight pr-24">
                      {c.word}
                    </h3>
                    <p className="text-xs italic text-on-surface-variant font-mono mt-1 font-semibold">
                      {c.translation}
                    </p>
                    {c.example && (
                      <p className="text-[11px] text-[#45464d] mt-2 font-serif border-l border-black/20 pl-2 max-w-md">
                        {c.example}
                      </p>
                    )}

                    {/* Info Bar */}
                    <div className="mt-4 bg-[#f0edea] border border-black p-2 flex gap-4 text-[10px] font-mono uppercase tracking-wider font-semibold w-fit">
                      <span>{t("review.masteryLvl")}: <strong className="text-[#ba1a1a]">LVL {c.repetitions}</strong></span>
                      <span className="border-l border-black/30 pl-4">{t("review.nextInterval")}: <strong>{c.interval}D</strong></span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleReviewSingleCard(c)}
                        className="bg-[#ffb054] hover:bg-[#ffa034] text-black border-2 border-black font-mono text-xs font-black uppercase px-5 py-2.5 shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm font-black">rate_review</span>
                        {t("review.reviewCardBtn")}
                      </button>
                    </div>
                  </div>

                </div>
              ))}

              {/* Upcoming Cards (Locked) */}
              {upcomingCards.map((c) => {
                const icon = getLeftIcon(c);
                return (
                  <div key={c.id} className="flex gap-4 items-start opacity-85">
                    
                    {/* Gutter Icon Circle */}
                    <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_#000] flex-shrink-0 mt-3">
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                    </div>

                    {/* Card Container */}
                    <div className="flex-grow bg-surface border-2 border-black p-5 shadow-[4px_4px_0_0_#000] relative neo-card">
                      {/* Push pin decorative icon to match mockup's bulletin board style */}
                      <div className="absolute top-2 right-2 transform rotate-12 opacity-40 select-none pointer-events-none">
                        <span className="material-symbols-outlined text-lg text-primary">push_pin</span>
                      </div>

                      {/* Locked status Stamp */}
                      <div className="absolute top-4 right-8 bg-[#f0edea] text-on-surface-variant border border-black/40 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider transform -rotate-1 select-none">
                        {getDueLabel(c)}
                      </div>

                      <h3 className="font-serif text-2xl font-bold text-on-surface-variant/70 tracking-tight pr-24">
                        {c.word}
                      </h3>
                      <p className="text-xs italic text-on-surface-variant opacity-60 font-mono mt-1">
                        {c.translation}
                      </p>

                      {/* Info Bar */}
                      <div className="mt-4 bg-[#f0edea] opacity-70 border border-black/60 p-2 flex gap-4 text-[10px] font-mono uppercase tracking-wider font-semibold w-fit">
                        <span>{t("review.masteryLvl")}: <strong>LVL {c.repetitions}</strong></span>
                        <span className="border-l border-black/30 pl-4">{t("review.nextInterval")}: <strong>{c.interval}D</strong></span>
                      </div>

                      {/* Action buttons (Locked) */}
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => toast.error(t("review.previewLockedWarning"))}
                          className="bg-[#f0edea] text-on-surface-variant/40 border-2 border-black/20 font-mono text-xs font-bold uppercase px-5 py-2.5 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">lock</span>
                          {t("review.lockedBtn")}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              {cards && cards.length === 0 && (
                <div className="w-full text-center py-16 font-mono text-sm opacity-60">
                  {t("review.emptyTitle")}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* --- REVIEW MODAL OVERLAY --- */}
      {activeReviewSession && sessionCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="w-full max-w-xl bg-[#fcfbf9] border-[3px] border-black p-6 md:p-8 shadow-[8px_8px_0_0_#000] relative flex flex-col gap-6 neo-card">
            
            {/* Close Button */}
            <button 
              onClick={handleCloseSession}
              className="absolute top-4 right-4 bg-surface hover:bg-[#ffdadb] hover:text-[#ba1a1a] border-2 border-black w-8 h-8 flex items-center justify-center font-bold transition-all cursor-pointer shadow-[2px_2px_0_0_#000] active:translate-y-0.5"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="border-b-2 border-black pb-2">
              <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-[#ba1a1a]">
                {t("review.session").toUpperCase()} · {activeReviewSession.completed + 1} / {activeReviewSession.queue.length}
              </span>
              <h2 className="font-serif text-3xl font-black uppercase tracking-tight mt-1">
                {t("review.eyebrow")}
              </h2>
            </div>

            {/* Active Card Content */}
            <div className="space-y-6">
              <Flashcard card={sessionCard} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
              
              <div className="flex justify-center">
                <AudioButton ref={audioButtonRef} card={sessionCard} />
              </div>

              {/* Quality rating interface */}
              <QualityButtons disabled={!flipped || submitting} onAnswer={onAnswer} />

              <p className="text-center font-label text-[10px] uppercase text-on-surface-variant font-bold opacity-60">
                {t("review.hint")}
              </p>
            </div>

            {/* Info panel in modal */}
            <div className="border-t border-black/15 pt-4">
              <CardMeta card={sessionCard} />
            </div>

          </div>
        </div>
      )}

      {/* --- SESSION COMPLETION VIEW OVERLAY --- */}
      {activeReviewSession && !sessionCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#fcfbf9] border-[3px] border-black p-8 shadow-[8px_8px_0_0_#000] text-center relative neo-card">
            
            <span className="material-symbols-outlined text-secondary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
            
            <h2 className="font-serif text-3xl font-black uppercase tracking-tight mb-2">
              {t("review.sessionCompleteTitle")}
            </h2>
            <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mb-6">
              {t("review.reviewedSummary", { n: activeReviewSession.completed })}
              {activeReviewSession.againCount > 0 && ` (${activeReviewSession.againCount} ${t("review.quality.again").toLowerCase()})`}.
            </p>

            <button
              onClick={handleCloseSession}
              className="w-full bg-primary text-surface border-2 border-primary py-3.5 font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer text-center"
            >
              {t("deck.games.btnProceed")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
