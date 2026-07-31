import NeoCard from "../ui/NeoCard.jsx";

export default function SessionStats({ remaining, completed, againCount }) {
  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">Session</h3>
      <dl className="space-y-3">
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">Remaining</dt>
          <dd className="font-ledger text-lg">{remaining}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">Completed</dt>
          <dd className="font-ledger text-lg">{completed}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-label text-label-md uppercase text-on-surface-variant">Again</dt>
          <dd className="font-ledger text-lg">{againCount}</dd>
        </div>
      </dl>
    </NeoCard>
  );
}
