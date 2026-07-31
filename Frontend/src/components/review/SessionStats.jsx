import NeoCard from "../ui/NeoCard.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function SessionStats({ remaining, completed, againCount }) {
  const t = useT();
  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">{t("review.session")}</h3>
      <dl className="space-y-3">
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">{t("review.remaining")}</dt>
          <dd className="font-ledger text-lg">{remaining}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">{t("review.completed")}</dt>
          <dd className="font-ledger text-lg">{completed}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">{t("review.quality.again")}</dt>
          <dd className="font-ledger text-lg">{againCount}</dd>
        </div>
      </dl>
    </NeoCard>
  );
}
