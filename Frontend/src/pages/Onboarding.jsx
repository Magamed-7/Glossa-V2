import { useState } from "react";
import LanguageCard from "../components/onboarding/LanguageCard.jsx";
import LevelPicker from "../components/onboarding/LevelPicker.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";

const LANGUAGES = [
  {
    code: "English",
    title: "English",
    description: "The global bridge of commerce, literature, and diplomacy.",
    gateway: "London",
    image: "/img/languages/english-london.webp",
  },
  {
    code: "Russian",
    title: "Russian",
    description: "Explore the profound depths of classical literature and cosmic ambition.",
    gateway: "Moscow",
    image: "/img/languages/russian-moscow.webp",
  },
  {
    code: "Tajik",
    title: "Tajik",
    description: "The ancient rhythm of the Silk Road and the high peaks of the Pamirs.",
    gateway: "Pamir",
    image: "/img/languages/tajik-pamir.webp",
  },
];

export default function Onboarding() {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [level, setLevel] = useState("A1");

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <header className="w-full px-margin-mobile md:px-margin-desktop py-8 max-w-7xl mx-auto flex justify-between items-center relative z-10">
        <span className="font-headline text-headline-lg text-tertiary italic">Glossa</span>
        <span className="hidden md:block font-label text-label-md text-on-surface-variant uppercase tracking-widest">
          Onboarding Protocol 1.0
        </span>
      </header>

      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 relative z-10">
        <div className="mb-section-gap max-w-3xl">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight">
            Choose Your <span className="italic text-secondary">Destination</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
            Linguistic mastery begins with a single step. Select the cultural landscape you wish to traverse
            and immerse yourself in our curated editorial curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-section-gap">
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              title={lang.title}
              description={lang.description}
              gateway={lang.gateway}
              image={lang.image}
              selected={selectedLanguage === lang.code}
              onSelect={() => setSelectedLanguage(lang.code)}
            />
          ))}
        </div>

        {selectedLanguage && (
          <div className="mb-section-gap">
            <p className="font-label text-label-md uppercase text-on-surface-variant mb-4">Your Current Level</p>
            <LevelPicker value={level} onChange={setLevel} />
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-end gap-8 pb-20">
          <div className="max-w-md">
            <p className="font-label text-label-md uppercase text-on-surface-variant mb-4">Selected Path</p>
            <div
              className={`font-headline text-headline-md border-b-2 border-tertiary pb-2 min-w-[200px] ${
                selectedLanguage ? "text-secondary" : ""
              }`}
            >
              {selectedLanguage || "None Selected"}
            </div>
          </div>
          <NeoButton
            className="flex items-center gap-2"
            disabled={!selectedLanguage}
          >
            Begin Journey
            <Icon name="flight_takeoff" />
          </NeoButton>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-2 bg-tertiary" />
    </div>
  );
}
