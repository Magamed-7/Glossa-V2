import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { useI18n, useT } from "../../lib/i18n.jsx";

// Демо-предложение намеренно всегда на английском — это язык, на котором фактически
// написано большинство историй в Glossa, вне зависимости от языка интерфейса. Переводится
// только сам перевод слова (под язык интерфейса) и текст вокруг демо, не сама фраза.
const DEMO_TRANSLATION = { en: "язык", ru: "язык", tg: "забон" };

function WordDemo() {
  const t = useT();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const translation = DEMO_TRANSLATION[lang] || DEMO_TRANSLATION.en;

  return (
    <div className="mt-4 border-2 border-dashed border-tertiary/40 p-6 bg-surface-container-lowest">
      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
        {t("onboarding.tour.stories.tryIt")}
      </p>
      <div className="font-body text-body-lg leading-relaxed">
        Learning a new{" "}
        <span className="relative inline-block">
          <span
            onClick={() => setOpen((v) => !v)}
            className={`cursor-pointer border-b-2 transition-colors ${
              open ? "border-secondary bg-secondary/10" : "border-secondary/50 hover:bg-secondary/5"
            }`}
          >
            language
          </span>
          {open && (
            <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2">
              <div className="relative bg-surface border-[3px] border-on-surface shadow-[4px_4px_0_0_#000] p-4 w-56 flex flex-col gap-3">
                <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-surface border-t-[3px] border-l-[3px] border-on-surface transform rotate-45" />
                <div className="flex justify-between items-start">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mt-1">
                    {t("onboarding.tour.stories.translationLabel")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdded(true)}
                    disabled={added}
                    className="w-7 h-7 bg-secondary text-surface border-2 border-on-surface flex items-center justify-center hover:bg-[#a01c33] transition-colors disabled:opacity-50 cursor-pointer"
                    title={t("onboarding.tour.stories.addToDeck")}
                  >
                    {added ? <Icon name="check" className="text-sm" /> : <span className="text-lg font-bold leading-none -mt-0.5">+</span>}
                  </button>
                </div>
                <div className="font-headline text-lg font-bold">{translation}</div>
              </div>
            </div>
          )}
        </span>
        opens many doors.
      </div>
      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-4">
        {t("onboarding.tour.stories.hint")}
      </p>
    </div>
  );
}

function TourSection({ number, icon, title, description, children }) {
  return (
    <div className="border-2 border-tertiary bg-surface p-6 md:p-8 flex gap-5 md:gap-8">
      <div className="shrink-0 flex flex-col items-center">
        <div className="w-12 h-12 border-2 border-tertiary bg-secondary text-on-secondary flex items-center justify-center font-display text-xl">
          {number}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Icon name={icon} className="text-secondary text-xl" />
          <h3 className="font-headline text-headline-md">{title}</h3>
        </div>
        <p className="font-body text-body-md text-on-surface-variant">{description}</p>
        {children}
      </div>
    </div>
  );
}

export default function AppTour({ onDone, submitting }) {
  const t = useT();

  return (
    <>
      <div className="mb-section-gap max-w-3xl">
        <p className="font-label text-label-md uppercase text-secondary tracking-widest mb-4">{t("onboarding.tour.eyebrow")}</p>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
          {t("onboarding.tour.titleLead")}
          <span className="italic text-secondary">{t("onboarding.tour.titleAccent")}</span>
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{t("onboarding.tour.description")}</p>
      </div>

      <div className="space-y-5 mb-section-gap">
        <TourSection
          number="01"
          icon="menu_book"
          title={t("onboarding.tour.grammar.title")}
          description={t("onboarding.tour.grammar.description")}
        />
        <TourSection
          number="02"
          icon="library_books"
          title={t("onboarding.tour.deck.title")}
          description={t("onboarding.tour.deck.description")}
        />
        <TourSection
          number="03"
          icon="sports_esports"
          title={t("onboarding.tour.games.title")}
          description={t("onboarding.tour.games.description")}
        />
        <TourSection
          number="04"
          icon="auto_stories"
          title={t("onboarding.tour.stories.title")}
          description={t("onboarding.tour.stories.description")}
        >
          <WordDemo />
        </TourSection>
      </div>

      <div className="flex justify-end pb-20">
        <NeoButton className="flex items-center gap-2" loading={submitting} onClick={onDone}>
          {t("onboarding.tour.cta")}
          <Icon name="flight_takeoff" />
        </NeoButton>
      </div>
    </>
  );
}
