import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import StoryBody from "../components/stories/StoryBody.jsx";
import StoryQuestions from "../components/stories/StoryQuestions.jsx";
import { useApi } from "../lib/useApi.js";
import { getMyProgress, getStory, saveProgress } from "../lib/api/stories.js";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

export default function StoryReader() {
  const { id } = useParams();
  // Локаль пока не передаётся явно — подключится в Фазе 19 (i18n), сервер использует
  // умолчание 'en' (см. API_CONTRACT.md §3.3). Этот запрос расходует дневной лимит чтения —
  // вызывается ровно один раз на открытие страницы.
  const { data: story, loading, error, reload } = useApi(() => getStory(id), [id]);
  const { data: progressList } = useApi(() => getMyProgress(), []);
  const progress = progressList?.find((p) => p.story_id === Number(id));

  const [completed, setCompleted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
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

  async function onMarkComplete() {
    setCompleted(true);
    try {
      await saveProgress(story.id, { is_completed: true });
    } catch (e) {
      setCompleted(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const cover = story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length];
  const hasTranslation = !!story.body_translated;

  return (
    <div className={`mx-auto pb-16 ${showTranslation && hasTranslation ? "max-w-5xl" : "max-w-2xl"}`}>
      <div className="aspect-[16/9] w-full overflow-hidden border-2 border-tertiary mb-8">
        <img className="w-full h-full object-cover" src={cover} alt="" aria-hidden="true" />
      </div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Badge level={story.cefr_level} />
          {story.genre && (
            <span className="font-label text-label-md text-on-surface-variant uppercase">{story.genre}</span>
          )}
        </div>
        {hasTranslation && (
          <button
            type="button"
            className="font-label text-label-md uppercase text-secondary underline underline-offset-4"
            onClick={() => setShowTranslation((v) => !v)}
          >
            {showTranslation ? "Hide translation" : "Show translation"}
          </button>
        )}
      </div>
      <h1 className="font-display text-headline-lg mb-2">{story.title}</h1>
      {story.title_translated && (
        <p className="font-body text-body-md italic text-on-surface-variant mb-8">{story.title_translated}</p>
      )}

      {showTranslation && hasTranslation ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <StoryBody body={story.body} words={story.words} storyId={story.id} />
          <div className="font-body text-body-lg leading-relaxed whitespace-pre-line italic text-on-surface-variant border-l-2 border-tertiary pl-6">
            {story.body_translated}
          </div>
        </div>
      ) : (
        <StoryBody body={story.body} words={story.words} storyId={story.id} />
      )}

      <StoryQuestions
        storyId={story.id}
        questions={story.questions}
        onCompleted={() => setCompleted(true)}
      />

      <div className="mt-10 pt-6 border-t-2 border-tertiary">
        <NeoButton
          variant={completed ? "ghost" : "primary"}
          disabled={completed}
          onClick={onMarkComplete}
          className="flex items-center gap-2"
        >
          <Icon name={completed ? "check_circle" : "task_alt"} />
          {completed ? "Marked as Read" : "Mark as Read"}
        </NeoButton>
      </div>
    </div>
  );
}
