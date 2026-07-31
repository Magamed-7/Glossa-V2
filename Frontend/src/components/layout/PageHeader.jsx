export default function PageHeader({ eyebrow, title, accent, subtitle, actions }) {
  return (
    <div className="mb-section-gap flex flex-col md:flex-row md:items-end md:justify-between gap-8">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">{eyebrow}</p>
        )}
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-4 leading-tight">
          {title} {accent && <span className="italic text-secondary">{accent}</span>}
        </h1>
        {subtitle && <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </div>
  );
}
