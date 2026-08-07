import { Link } from "react-router-dom";
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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-serif font-black text-xl text-black dark:text-stone-100 whitespace-nowrap">
          {t("market.allBooks")}
        </h3>
        <div className="h-px bg-black dark:bg-stone-700 flex-1" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/marketplace/${story.id}`}
            className="group block border-2 border-black dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a] hover:-translate-y-1 transition-all"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-black dark:border-stone-800">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length]}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={320}
                height={240}
              />
              <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-white border border-black bg-[#E32652] uppercase">
                {story.cefr_level}
              </span>
            </div>
            <div className="p-3">
              <h4 className="font-serif font-black text-sm text-black dark:text-stone-100 truncate">{story.title}</h4>
              <p className={`font-mono text-xs font-bold mt-1 ${story.price ? "text-black dark:text-stone-200" : "text-[#E32652]"}`}>
                {story.price ? formatMoney(story.price) : t("market.free")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
