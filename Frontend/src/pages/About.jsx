import { useT } from "../lib/i18n.jsx";
import Icon from "../components/ui/Icon.jsx";

const PILLARS = [
  { key: "stories", icon: "auto_stories" },
  { key: "grammar", icon: "menu_book" },
  { key: "tutor", icon: "smart_toy" },
  { key: "community", icon: "groups" },
];

export default function About() {
  const t = useT();

  return (
    <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">{t("about.eyebrow")}</p>
      <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-10 leading-tight">{t("about.title")}</h1>

      <div className="font-body text-body-lg text-on-surface-variant space-y-6 mb-16 max-w-2xl">
        <p>{t("about.paragraph1")}</p>
        <p>{t("about.paragraph2")}</p>
      </div>

      <div className="border-t-2 border-tertiary pt-12">
        <h2 className="font-headline text-headline-md mb-8">{t("about.pillarsTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PILLARS.map(({ key, icon }) => (
            <div key={key} className="flex gap-4">
              <div className="w-10 h-10 shrink-0 border-2 border-tertiary flex items-center justify-center">
                <Icon name={icon} />
              </div>
              <div>
                <h3 className="font-headline text-headline-md mb-1">{t(`about.pillars.${key}.title`)}</h3>
                <p className="font-body text-body-md text-on-surface-variant">{t(`about.pillars.${key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
