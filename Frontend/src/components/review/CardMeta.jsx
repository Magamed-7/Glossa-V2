import NeoCard from "../ui/NeoCard.jsx";
import { formatDate } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function CardMeta({ card }) {
  const t = useT();
  return (
    <NeoCard variant="accent">
      <h3 className="font-headline text-headline-md mb-4">{t("review.algorithmState")}</h3>
      <dl className="space-y-3 font-ledger text-sm">
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">{t("review.easeFactor")}</dt>
          <dd>{card.ease_factor.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">{t("review.repetitions")}</dt>
          <dd>{card.repetitions}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">{t("review.interval")}</dt>
          <dd>{card.interval}{t("review.daysSuffix")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">{t("review.nextReview")}</dt>
          <dd>{card.next_review_date ? formatDate(card.next_review_date) : t("review.now")}</dd>
        </div>
      </dl>
    </NeoCard>
  );
}
