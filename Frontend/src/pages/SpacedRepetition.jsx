import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Flashcard from "../components/review/Flashcard.jsx";
import QualityButtons from "../components/review/QualityButtons.jsx";
import AudioButton from "../components/review/AudioButton.jsx";
import SessionStats from "../components/review/SessionStats.jsx";
import CardMeta from "../components/review/CardMeta.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../lib/toast.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getDueToday, submitReview } from "../lib/api/reviews.js";
import { useAppData } from "../lib/AppDataContext.jsx";

export default function SpacedRepetition() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshStreak } = useAppData();
  const { data: queue, loading, error, reload } = useApi(() => getDueToday(), []);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [completed, setCompleted] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const audioButtonRef = useRef(null);

  const card = currentCard ?? queue?.[index] ?? null;
  const remaining = queue ? queue.length - index : 0;

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      if (!card) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, flipped, submitting]);

  async function onAnswer(quality) {
    if (!card || submitting) return;
    setSubmitting(true);

    try {
      await submitReview(card.id, quality);
      if (quality === 0) setAgainCount((c) => c + 1);
      setCompleted((c) => c + 1);
      if (completed === 0) refreshStreak();
      setFlipped(false);
      setCurrentCard(null);
      setIndex((i) => i + 1);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Daily Practice" title="The Lexical" accent="Gauge" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Daily Practice" title="The Lexical" accent="Gauge" />
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Daily Practice" title="The Lexical" accent="Gauge" />
        <EmptyState
          icon="task_alt"
          title="Nothing due right now"
          description="Add more words to your deck, or come back later when the next batch is ready."
          action={<NeoButton onClick={() => navigate("/deck")}>Go to Deck</NeoButton>}
        />
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div>
        <PageHeader eyebrow="Daily Practice" title="The Lexical" accent="Gauge" />
        <EmptyState
          icon="celebration"
          title="Session complete"
          description={`You reviewed ${completed} word${completed === 1 ? "" : "s"}${
            againCount ? `, ${againCount} needing another pass` : ""
          }.`}
          action={
            <div className="flex gap-4">
              <NeoButton variant="ghost" onClick={() => navigate("/deck")}>
                Deck
              </NeoButton>
              <NeoButton onClick={() => navigate("/")}>Dashboard</NeoButton>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Daily Practice" title="The Lexical" accent="Gauge" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-8">
        <div className="order-2 lg:order-1">
          <SessionStats remaining={remaining} completed={completed} againCount={againCount} />
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          <div className="flex justify-center">
            <AudioButton ref={audioButtonRef} card={card} />
          </div>
          <QualityButtons disabled={!flipped || submitting} onAnswer={onAnswer} />
          <p className="text-center font-label text-label-md uppercase text-on-surface-variant opacity-60">
            Space to flip · 1–4 to answer · S to listen
          </p>
        </div>

        <div className="order-3">
          <CardMeta card={card} />
        </div>
      </div>
    </div>
  );
}
