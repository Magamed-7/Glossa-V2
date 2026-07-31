import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

function coverFor(story) {
  if (story.image_url) return story.image_url;
  return FALLBACK_COVERS[story.id % FALLBACK_COVERS.length];
}

export default function StoryCard({ story, progress }) {
  const t = useT();
  return (
    <Link
      to={`/stories/${story.id}`}
      className="group block border-2 border-tertiary hard-shadow hover:-translate-y-1 transition-all"
    >
      <div className="aspect-[4/5] w-full overflow-hidden border-b-2 border-tertiary relative">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={coverFor(story)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={480}
          height={600}
        />
        {progress?.is_completed && (
          <span className="absolute top-3 right-3 bg-secondary text-on-secondary rounded-full p-1">
            <Icon name="check" className="text-sm" />
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label text-label-md uppercase border-2 border-tertiary px-2 py-0.5">
            {story.cefr_level}
          </span>
          {progress && !progress.is_completed && (
            <span className="font-label text-label-md text-secondary uppercase">{t("stories.reading")}</span>
          )}
        </div>
        <h3 className="font-headline text-xl mb-1">{story.title}</h3>
        {story.genre && <p className="font-body text-body-md text-on-surface-variant">{story.genre}</p>}
      </div>
    </Link>
  );
}
