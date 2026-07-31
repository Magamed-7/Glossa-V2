export default function Corrections({ corrections }) {
  if (!corrections || corrections.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 border-l-2 border-secondary pl-4">
      {corrections.map((c, i) => (
        <div key={i} className="font-body text-body-md">
          <p className="line-through opacity-60">{c.what}</p>
          <p className="text-on-surface-variant text-sm">{c.why}</p>
          <p className="text-secondary font-bold">{c.better}</p>
        </div>
      ))}
    </div>
  );
}
