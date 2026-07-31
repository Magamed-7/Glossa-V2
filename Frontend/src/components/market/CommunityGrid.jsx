import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

export default function CommunityGrid({ stories }) {
  const t = useT();
  if (stories.length === 0) return null;

  return (
    <div className="mt-section-gap">
      <h3 className="font-display text-headline-lg mb-6">{t("market.communitySubmissions")}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/marketplace/${story.id}`}
            className="group block border-2 border-tertiary hover:-translate-y-1 transition-all bg-surface"
          >
            <div className="aspect-[4/5] w-full overflow-hidden border-b-2 border-tertiary">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length]}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={320}
                height={400}
              />
            </div>
            <div className="p-3">
              <Badge level={story.cefr_level} className="mb-2 text-[10px] px-2 py-0.5" />
              <h4 className="font-headline text-sm truncate">{story.title}</h4>
              <p className="font-ledger text-xs text-secondary mt-1">
                {story.price ? formatMoney(story.price) : t("market.free")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
