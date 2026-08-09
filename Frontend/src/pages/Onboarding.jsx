import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageCard from "../components/onboarding/LanguageCard.jsx";
import LevelPicker from "../components/onboarding/LevelPicker.jsx";
import AppTour from "../components/onboarding/AppTour.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { addLanguage } from "../lib/api/profile.js";
import { updateSettings } from "../lib/api/settings.js";
import { submitOnboarding } from "../lib/api/learning.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { useToast } from "../lib/toast.jsx";
import { LANGS, useI18n, useT } from "../lib/i18n.jsx";

const MINUTE_OPTIONS = [15, 30, 60];

function PaceStep({ minutes, onChangeMinutes, onBack, onContinue }) {
  const t = useT();

  return (
    <>
      <div className="mb-section-gap max-w-3xl">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
          {t("onboarding.pace.titleLead")}
          <span className="italic text-secondary">{t("onboarding.pace.titleAccent")}</span>
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{t("onboarding.pace.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-section-gap max-w-2xl">
        {MINUTE_OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChangeMinutes(m)}
            aria-pressed={minutes === m}
            className={`text-center p-8 border-2 transition-all ${
              minutes === m ? "border-secondary hard-shadow-crimson text-secondary" : "border-tertiary hard-shadow hover:-translate-y-1"
            }`}
          >
            <span className="font-display text-5xl block mb-2">{m}</span>
            <span className="font-label text-label-md uppercase tracking-widest">{t("onboarding.pace.minutesPerDay")}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center pb-20">
        <button
          type="button"
          onClick={onBack}
          className="font-label text-label-md uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors underline underline-offset-4"
        >
          {t("onboarding.back")}
        </button>
        <NeoButton className="flex items-center gap-2" onClick={onContinue}>
          {t("onboarding.pace.continue")}
          <Icon name="arrow_forward" />
        </NeoButton>
      </div>
    </>
  );
}

// `code` — реальное значение поля `language`, которое уходит в API; не переводить.
const LANGUAGES = [
  { code: "English", key: "english", image: "/img/languages/english-london.webp" },
  { code: "Russian", key: "russian", image: "/img/languages/russian-moscow.webp" },
  { code: "Tajik", key: "tajik", image: "/img/languages/tajik-pamir.png" },
];

// Родной/интерфейсный язык — те же три языка и те же фото, но выбор здесь настраивает
// `useI18n().setLang()`, а не то, что человек изучает (см. `LANGUAGES` выше).
const NATIVE_IMAGES = { en: "/img/languages/english-london.webp", ru: "/img/languages/russian-moscow.webp", tg: "/img/languages/tajik-pamir.png" };

function NativeLanguageStep({ onDone }) {
  const t = useT();
  const { lang, setLang } = useI18n();

  function selectNative(code) {
    setLang(code);
    updateSettings({ interface_language: code }).catch(() => {});
  }

  return (
    <>
      <div className="mb-section-gap max-w-3xl">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
          {t("onboarding.native.titleLead")}
          <span className="italic text-secondary">{t("onboarding.native.titleAccent")}</span>
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{t("onboarding.native.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-section-gap">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => selectNative(l.code)}
            aria-pressed={lang === l.code}
            className={`group text-left relative bg-surface-container-lowest border-2 p-6 flex flex-col h-full transition-all ${
              lang === l.code ? "border-secondary hard-shadow-crimson" : "border-tertiary hard-shadow hover:-translate-y-1"
            }`}
          >
            <div className="aspect-[4/5] w-full overflow-hidden border-2 border-tertiary mb-6">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={NATIVE_IMAGES[l.code]}
                alt=""
                aria-hidden="true"
                loading="eager"
                width={480}
                height={600}
              />
            </div>
            <div className="flex flex-col flex-grow">
              <h3 className="font-headline text-headline-md mb-2">{l.name}</h3>
              <div className="mt-auto flex justify-between items-center">
                <span className="font-label text-label-md uppercase bg-secondary-container text-on-secondary-container px-3 py-1 border-2 border-tertiary">
                  {l.label}
                </span>
                <Icon
                  name="arrow_forward"
                  className={`text-secondary transition-transform ${lang === l.code ? "translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pb-20">
        <NeoButton className="flex items-center gap-2" onClick={onDone}>
          {t("onboarding.native.continue")}
          <Icon name="arrow_forward" />
        </NeoButton>
      </div>
    </>
  );
}

export default function Onboarding() {
  const t = useT();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState("native");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [level, setLevel] = useState("A1");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  async function onBeginJourney() {
    setSubmitting(true);

    try {
      await addLanguage({ language: selectedLanguage, level, is_target: true });
      await updateSettings({ target_language: selectedLanguage });
      await submitOnboarding({ daily_minutes_budget: dailyMinutes });
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <header className="w-full px-margin-mobile md:px-margin-desktop py-8 max-w-7xl mx-auto flex justify-between items-center relative z-10">
        <span className="font-headline text-headline-lg text-tertiary italic">Glossa</span>
        <span className="hidden md:block font-label text-label-md text-on-surface-variant uppercase tracking-widest">
          {t("onboarding.eyebrow")}
        </span>
      </header>

      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 relative z-10">
        {step === "native" ? (
          <NativeLanguageStep onDone={() => setStep("target")} />
        ) : step === "pace" ? (
          <PaceStep
            minutes={dailyMinutes}
            onChangeMinutes={setDailyMinutes}
            onBack={() => setStep("target")}
            onContinue={() => setStep("tour")}
          />
        ) : step === "tour" ? (
          <AppTour submitting={submitting} onDone={onBeginJourney} />
        ) : (
          <>
            <div className="mb-section-gap max-w-3xl">
              <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
                {t("onboarding.titleLead")}
                <span className="italic text-secondary">{t("onboarding.titleAccent")}</span>
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{t("onboarding.description")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-section-gap">
              {LANGUAGES.map((lang) => (
                <LanguageCard
                  key={lang.code}
                  title={t(`onboarding.languages.${lang.key}.title`)}
                  description={t(`onboarding.languages.${lang.key}.description`)}
                  gateway={t(`onboarding.languages.${lang.key}.gateway`)}
                  image={lang.image}
                  selected={selectedLanguage === lang.code}
                  onSelect={() => setSelectedLanguage(lang.code)}
                />
              ))}
            </div>

            {selectedLanguage && (
              <div className="mb-section-gap">
                <p className="font-label text-label-md uppercase text-on-surface-variant mb-4">{t("onboarding.currentLevel")}</p>
                <LevelPicker value={level} onChange={setLevel} />
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end gap-8 pb-20">
              <div className="max-w-md">
                <p className="font-label text-label-md uppercase text-on-surface-variant mb-4">{t("onboarding.selectedPath")}</p>
                <div
                  className={`font-headline text-headline-md border-b-2 border-tertiary pb-2 min-w-[200px] ${
                    selectedLanguage ? "text-secondary" : ""
                  }`}
                >
                  {selectedLanguage || t("onboarding.noneSelected")}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStep("native")}
                  className="font-label text-label-md uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors underline underline-offset-4"
                >
                  {t("onboarding.back")}
                </button>
                <NeoButton
                  className="flex items-center gap-2"
                  disabled={!selectedLanguage}
                  onClick={() => setStep("pace")}
                >
                  {t("onboarding.continue")}
                  <Icon name="arrow_forward" />
                </NeoButton>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full h-2 bg-tertiary" />
    </div>
  );
}
