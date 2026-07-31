import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageCard from "../components/onboarding/LanguageCard.jsx";
import LevelPicker from "../components/onboarding/LevelPicker.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { addLanguage } from "../lib/api/profile.js";
import { updateSettings } from "../lib/api/settings.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { useToast } from "../lib/toast.jsx";
import { useT } from "../lib/i18n.jsx";

// `code` — реальное значение поля `language`, которое уходит в API; не переводить.
const LANGUAGES = [
  { code: "English", key: "english", image: "/img/languages/english-london.webp" },
  { code: "Russian", key: "russian", image: "/img/languages/russian-moscow.webp" },
  { code: "Tajik", key: "tajik", image: "/img/languages/tajik-pamir.webp" },
];

export default function Onboarding() {
  const t = useT();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [level, setLevel] = useState("A1");
  const [submitting, setSubmitting] = useState(false);

  async function onBeginJourney() {
    setSubmitting(true);

    try {
      await addLanguage({ language: selectedLanguage, level, is_target: true });
      await updateSettings({ target_language: selectedLanguage });
      await refreshUser();
      navigate("/", { replace: true });
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
          <NeoButton
            className="flex items-center gap-2"
            disabled={!selectedLanguage}
            loading={submitting}
            onClick={onBeginJourney}
          >
            {t("onboarding.begin")}
            <Icon name="flight_takeoff" />
          </NeoButton>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-2 bg-tertiary" />
    </div>
  );
}
