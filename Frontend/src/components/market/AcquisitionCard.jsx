import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
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
      className="group block border-2 border-tertiary hard-shadow-lg hover:-translate-y-1 transition-all bg-surface"
    >
      <div className="aspect-[4/5] w-full overflow-hidden border-b-2 border-tertiary">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={cover}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={480}
          height={600}
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge level={story.cefr_level} />
          {story.average_rating != null && (
            <span className="font-label text-label-md flex items-center gap-1">
              <Icon name="star" filled className="text-secondary text-sm" />
              {story.average_rating.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="font-headline text-xl mb-1">{story.title}</h3>
        <p className="font-body text-body-md text-on-surface-variant mb-3">
          {t("market.by", { name: author?.username || "…" })}
        </p>
        <p className="font-ledger text-secondary">
          {story.price ? formatMoney(story.price) : t("market.free")}
        </p>
      </div>
    </Link>
  );
}
