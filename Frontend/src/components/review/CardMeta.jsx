import NeoCard from "../ui/NeoCard.jsx";
import { formatDate } from "../../lib/format.js";

export default function CardMeta({ card }) {
  return (
    <NeoCard variant="accent">
      <h3 className="font-headline text-headline-md mb-4">Algorithm State</h3>
      <dl className="space-y-3 font-ledger text-sm">
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">Ease Factor</dt>
          <dd>{card.ease_factor.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">Repetitions</dt>
          <dd>{card.repetitions}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">Interval</dt>
          <dd>{card.interval}d</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase text-on-surface-variant">Next Review</dt>
          <dd>{card.next_review_date ? formatDate(card.next_review_date) : "Now"}</dd>
        </div>
      </dl>
    </NeoCard>
  );
}
