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

// Бейдж уровня циклится по трём вариантам (янтарный / кремовый / малиновый) для
// визуального ритма, как в макете — не привязан к конкретному CEFR-уровню.
const BADGE_VARIANTS = [
  "bg-tertiary-fixed-dim border-2 border-primary text-on-tertiary-fixed",
  "bg-surface-bright border-2 border-primary text-primary",
  "bg-secondary border-2 border-primary text-on-secondary",
];

const CLIP_ROTATIONS = ["rotate-12", "-rotate-6", "rotate-[20deg]"];

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1 mb-6 text-tertiary-fixed-dim">
      {Array.from({ length: full }, (_, i) => (
        <Icon key={`f${i}`} name="star" filled className="text-base" />
      ))}
      {hasHalf && <Icon name="star_half" filled className="text-base" />}
      {Array.from({ length: empty }, (_, i) => (
        <Icon key={`e${i}`} name="star" className="text-base" />
      ))}
      <span className="font-label text-label-md text-on-surface ml-2">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AcquisitionCard({ story, variant = 0 }) {
  const t = useT();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    resolveUser(story.author_id).then(setAuthor);
  }, [story.author_id]);

  const cover = story.image_url || FALLBACK_COVERS[story.id % FALLBACK_COVERS.length];
  const badgeClass = BADGE_VARIANTS[variant % BADGE_VARIANTS.length];
  const clipRotation = CLIP_ROTATIONS[variant % CLIP_ROTATIONS.length];

  return (
    <Link to={`/marketplace/${story.id}`} className="bg-surface-bright border-2 border-primary p-6 hard-shadow relative group block">
      <div
        className={`absolute -top-3 left-6 w-8 h-12 border-2 border-primary rounded-full bg-outline-variant/30 flex justify-center items-start pt-1 ${clipRotation}`}
      >
        <div className="w-4 h-8 border-2 border-primary rounded-full" />
      </div>

      <div className="aspect-[4/3] mb-4 border-2 border-primary overflow-hidden bg-surface-container relative">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={cover}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={480}
          height={360}
        />
        <div className={`absolute top-2 right-2 px-2 py-1 font-label text-label-md font-bold uppercase ${badgeClass}`}>
          {story.cefr_level}
        </div>
      </div>

      <h3 className="font-headline text-headline-lg text-primary mb-2 leading-tight">{story.title}</h3>
      <p className="font-label text-label-md text-on-surface-variant mb-4">
        {t("market.by", { name: author?.username || "…" })}
      </p>

      {story.average_rating != null && <StarRating rating={story.average_rating} />}

      <div className="flex justify-between items-center border-t-2 border-primary pt-4">
        <span className={`font-body text-body-md font-bold ${story.price ? "text-on-surface" : "text-secondary"}`}>
          {story.price ? formatMoney(story.price) : t("market.free")}
        </span>
        <span
          className={`px-6 py-2 border-2 border-primary font-label text-label-md uppercase hard-shadow transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:[box-shadow:2px_2px_0_0_var(--color-tertiary)] ${
            story.price ? "bg-secondary text-on-secondary" : "bg-surface-container-highest text-primary"
          }`}
        >
          {story.price ? t("market.buy") : t("market.read")}
        </span>
      </div>
    </Link>
  );
}
