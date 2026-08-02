import { useT } from "../lib/i18n.jsx";
import Icon from "../components/ui/Icon.jsx";

const PILLARS = [
  { key: "documentation", icon: "history_edu" },
  { key: "translation", icon: "translate" },
  { key: "education", icon: "menu_book" },
];

const CURATORS = [
  { key: "osaf", name: "Dr. Osaf Abdulloev", image: "/img/marketing/curator-osaf.webp" },
  { key: "julian", name: "Ruslan Sodatov", image: "/img/marketing/curator-ruslan.webp" },
  { key: "mika", name: "Mika Chen", image: "/img/marketing/curator-mika.webp" },
  { key: "arthur", name: "Arthur P. Vance", image: "/img/marketing/curator-arthur.webp" },
];

export default function About() {
  const t = useT();

  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-16 md:pt-20 pb-section-gap">
      <header className="mb-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-8">
          <span className="font-label text-label-md text-secondary uppercase tracking-widest mb-4 block">{t("about.eyebrow")}</span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg leading-tight mb-8">
            {t("about.titleLead")} <span className="italic font-normal">{t("about.titleAccent")}</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">{t("about.mission")}</p>
        </div>
        <div className="md:col-span-4 self-end">
          <div className="border-2 border-tertiary p-6 bg-surface-container-low hard-shadow rotate-1">
            <p className="font-display text-headline-md italic mb-2">{t("about.quote.text")}</p>
            <p className="font-label text-label-md">{t("about.quote.author")}</p>
          </div>
        </div>
      </header>

      <section className="mb-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-5 order-2 md:order-1">
          <div className="relative">
            <div className="absolute -inset-4 border-2 border-secondary/20 z-0 opacity-50" aria-hidden="true" />
            <div className="relative z-10 border-2 border-tertiary hard-shadow overflow-hidden">
            <img
              className="w-full h-[420px] object-cover grayscale contrast-125"
              src="/img/marketing/about-typewriter.webp"
              srcSet="/img/marketing/about-typewriter.webp 800w, /img/marketing/about-typewriter@2x.webp 1600w"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={800}
              height={1000}
            />
            </div>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7 order-1 md:order-2 mb-12 md:mb-0">
          <h2 className="font-display text-headline-lg mb-6">{t("about.history.title")}</h2>
          <div className="space-y-6 font-body text-body-md text-on-surface-variant leading-relaxed">
            <p>{t("about.history.paragraph1")}</p>
            <p>{t("about.history.paragraph2")}</p>
          </div>
        </div>
      </section>

      <section className="mb-section-gap bg-[#1c1c1a] text-white p-12 md:p-24 border-2 border-tertiary overflow-hidden relative">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-display-lg-mobile md:text-headline-lg mb-8">{t("about.preservation.title")}</h2>
          <p className="font-body text-body-lg text-white/80 mb-12">{t("about.preservation.description")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((p) => (
              <div key={p.key} className="p-6 border border-white/20">
                <Icon name={p.icon} className="text-4xl mb-4 text-secondary block" />
                <h3 className="font-headline text-headline-md mb-2">{t(`about.preservation.pillars.${p.key}.title`)}</h3>
                <p className="font-label text-label-md opacity-70">{t(`about.preservation.pillars.${p.key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-section-gap">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl">
            <h2 className="font-display text-headline-lg mb-4">{t("about.curators.title")}</h2>
            <p className="font-body text-body-md text-on-surface-variant">{t("about.curators.description")}</p>
          </div>
          <div className="h-[2px] flex-grow bg-tertiary mx-8 hidden md:block" aria-hidden="true" />
          <span className="font-label text-label-md uppercase tracking-tighter">{t("about.curators.est")}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          {CURATORS.map((c) => (
            <div key={c.key} className="group">
              <div className="mb-6 overflow-hidden border-2 border-tertiary grayscale hover:grayscale-0 transition-all duration-500">
                <img
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
                  src={c.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={480}
                  height={640}
                />
              </div>
              <h4 className="font-headline text-headline-md">{c.name}</h4>
              <p className="font-label text-label-md text-secondary uppercase mb-2">{t(`about.curators.people.${c.key}.role`)}</p>
              <p className="font-body text-body-md text-on-surface-variant text-sm italic">{t(`about.curators.people.${c.key}.bio`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter py-16 border-t-2 border-tertiary">
        <div className="bg-surface-container p-12 border-2 border-tertiary flex flex-col justify-center">
          <h3 className="font-display text-headline-lg mb-6">{t("about.tools.title")}</h3>
          <p className="font-body text-body-md text-on-surface-variant mb-8">{t("about.tools.description")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square border border-tertiary overflow-hidden">
              <img className="w-full h-full object-cover grayscale" src="/img/marketing/tool-pen-nib.webp" alt="" aria-hidden="true" loading="lazy" width={480} height={480} />
            </div>
            <div className="aspect-square border border-tertiary overflow-hidden">
              <img className="w-full h-full object-cover grayscale" src="/img/marketing/tool-card-catalog.webp" alt="" aria-hidden="true" loading="lazy" width={480} height={480} />
            </div>
          </div>
        </div>
        <div className="relative min-h-[400px] border-2 border-tertiary overflow-hidden group">
          <img
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            src="/img/marketing/archive-room.webp"
            srcSet="/img/marketing/archive-room.webp 1200w, /img/marketing/archive-room@2x.webp 2400w"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1200}
            height={800}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white/90 p-8 border-2 border-[#1c1c1a] shadow-[4px_4px_0_0_#b90538] max-w-xs text-center">
              <span className="font-label text-label-md text-secondary uppercase">{t("about.archiveEntry.eyebrow")}</span>
              <p className="font-headline text-headline-md text-[#1c1c1a] mt-2">{t("about.archiveEntry.title")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
