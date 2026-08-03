import PageHeader from "../components/layout/PageHeader.jsx";
import { useT } from "../lib/i18n.jsx";

export default function Terms() {
  const t = useT();
  const sections = t("legal.terms.sections");

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop pt-16 md:pt-20 pb-section-gap">
      <PageHeader eyebrow={t("legal.terms.eyebrow")} title={t("legal.terms.title")} accent={t("legal.terms.accent")} />
      <p className="font-label text-label-md uppercase tracking-widest text-on-surface-variant mb-12">{t("legal.terms.updated")}</p>
      <div className="flex flex-col gap-10">
        {sections.map((s) => (
          <section key={s.title} className="pb-10 border-b border-tertiary/20 last:border-0">
            <h2 className="font-headline text-headline-md mb-3">{s.title}</h2>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
