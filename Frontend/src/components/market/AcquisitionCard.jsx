import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { resolveUser } from "../../lib/api/_pending/userLookup.js";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const FALLBACK_COVERS = [
  "/img/covers/midnight-cafe.webp",
  "/img/covers/silicon-valley.webp",
  "/img/covers/echoes-void.webp",
];

export default function AcquisitionCard({ story }) {
  const t = useT();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    resolveUser(story.author_id).then(setAuthor);
  }, [story.author_id]);

  const cover = story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length];

  return (
    <Link
      to={`/marketplace/${story.id}`}
      className="group relative block border-2 border-black dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] hover:-translate-y-1 transition-all"
    >
      <Icon
        name="attach_file"
        className="absolute -top-3 left-6 text-2xl text-black dark:text-stone-300 rotate-[-25deg] z-10 pointer-events-none"
      />

      <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-black dark:border-stone-800">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={cover}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={480}
          height={360}
        />
        <span className="absolute top-3 right-3 px-2 py-1 text-[9px] font-black tracking-wider text-white border border-black bg-[#E32652] uppercase shadow-[2px_2px_0px_#000000]">
          {story.cefr_level}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-serif font-black text-xl text-black dark:text-stone-100 leading-tight mb-1">
          {story.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-stone-400 font-sans mb-2">
          {t("market.by", { name: author?.username || "…" })}
        </p>

        {story.average_rating != null && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Icon
                key={i}
                name="star"
                filled={i < Math.round(story.average_rating)}
                className={`text-sm ${i < Math.round(story.average_rating) ? "text-amber-500" : "text-gray-300 dark:text-stone-700"}`}
              />
            ))}
            <span className="text-xs font-bold text-black dark:text-stone-200 font-sans ml-1">
              {story.average_rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-stone-800">
          <span className={`font-mono text-sm font-black ${story.price ? "text-black dark:text-stone-100" : "text-[#E32652]"}`}>
            {story.price ? formatMoney(story.price) : t("market.free")}
          </span>
          <span
            className={`px-4 py-1.5 border-2 border-black dark:border-stone-700 font-label text-[10px] uppercase font-bold shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] transition-colors ${
              story.price
                ? "bg-[#E32652] group-hover:bg-[#c11c42] text-white"
                : "bg-white dark:bg-stone-800 text-black dark:text-stone-200 group-hover:bg-stone-100 dark:group-hover:bg-stone-700"
            }`}
          >
            {story.price ? t("market.buy") : t("market.read")}
          </span>
        </div>
      </div>
    </Link>
  );
}
