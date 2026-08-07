import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

const BADGE_VARIANTS = [
  "bg-tertiary-fixed-dim border border-primary text-on-tertiary-fixed",
  "bg-surface-bright border border-primary text-primary",
  "bg-secondary border border-primary text-on-secondary",
];

export default function CommunityGrid({ stories }) {
  const t = useT();
  if (stories.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-headline text-headline-md text-primary whitespace-nowrap">
          {t("market.allBooks")}
        </h3>
        <div className="flex-1 h-[2px] bg-primary" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-gutter">
        {stories.map((story, i) => (
          <Link
            key={story.id}
            to={`/marketplace/${story.id}`}
            className="group block bg-surface-bright border-2 border-primary hard-shadow transition-all"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-primary bg-surface-container">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length]}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={320}
                height={240}
              />
              <span className={`absolute top-2 right-2 px-1.5 py-0.5 font-label text-[10px] font-bold uppercase ${BADGE_VARIANTS[i % BADGE_VARIANTS.length]}`}>
                {story.cefr_level}
              </span>
            </div>
            <div className="p-3">
              <h4 className="font-headline text-body-md text-primary truncate">{story.title}</h4>
              <p className={`font-body text-label-md font-bold mt-1 ${story.price ? "text-on-surface" : "text-secondary"}`}>
                {story.price ? formatMoney(story.price) : t("market.free")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
