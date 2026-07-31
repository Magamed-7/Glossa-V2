import { useParams } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Badge from "../components/ui/Badge.jsx";
import { useApi } from "../lib/useApi.js";
import { getStory } from "../lib/api/stories.js";

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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="aspect-[16/9] w-full overflow-hidden border-2 border-tertiary mb-8">
        <img className="w-full h-full object-cover" src={cover} alt="" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Badge level={story.cefr_level} />
        {story.genre && <span className="font-label text-label-md text-on-surface-variant uppercase">{story.genre}</span>}
      </div>
      <h1 className="font-display text-headline-lg mb-2">{story.title}</h1>
      {story.title_translated && (
        <p className="font-body text-body-md italic text-on-surface-variant mb-8">{story.title_translated}</p>
      )}
      <div className="font-body text-body-lg leading-relaxed whitespace-pre-line">{story.body}</div>
    </div>
  );
}
