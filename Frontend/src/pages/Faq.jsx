import { useT } from "../lib/i18n.jsx";
import Icon from "../components/ui/Icon.jsx";

const QUESTIONS = ["languages", "register", "verifyEmail", "pricing", "aiTutor", "changeLanguage"];

export default function Faq() {
  const t = useT();

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">{t("faq.eyebrow")}</p>
      <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-12 leading-tight">{t("faq.title")}</h1>

      <div className="space-y-4">
        {QUESTIONS.map((key) => (
          <details key={key} className="group border-2 border-tertiary bg-surface">
            <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-headline text-headline-md list-none">
              {t(`faq.items.${key}.question`)}
              <Icon name="add" className="shrink-0 transition-transform group-open:rotate-45" />
            </summary>
            <p className="font-body text-body-md text-on-surface-variant px-6 pb-6 max-w-2xl">
              {t(`faq.items.${key}.answer`)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
