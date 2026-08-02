import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n.jsx";
import Icon from "../components/ui/Icon.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";

const CATEGORIES = [
  { key: "account", number: "01", items: ["register", "verifyEmail", "changeLanguage"] },
  { key: "learning", number: "02", items: ["languages", "aiTutor"] },
  { key: "billing", number: "03", items: ["pricing"] },
];

export default function Faq() {
  const t = useT();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  function matches(key) {
    if (!q) return true;
    const question = t(`faq.items.${key}.question`).toLowerCase();
    const answer = t(`faq.items.${key}.answer`).toLowerCase();
    return question.includes(q) || answer.includes(q);
  }

  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <section className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="max-w-2xl">
            <p className="font-label text-label-md text-secondary uppercase tracking-widest mb-4">{t("faq.eyebrow")}</p>
            <h1 className="font-display text-display-lg italic leading-none">{t("faq.title")}</h1>
            <p className="font-body text-body-lg text-on-surface-variant mt-6 italic">{t("faq.subtitle")}</p>
          </div>
          <div className="w-full md:w-80 flex flex-col gap-2">
            <label className="font-label text-label-md uppercase text-xs" htmlFor="faq-search">
              {t("faq.searchLabel")}
            </label>
            <div className="relative">
              <input
                id="faq-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("faq.searchPlaceholder")}
                className="w-full py-2 font-display text-xl italic px-0 bg-transparent border-0 border-b-2 border-tertiary focus:outline-none focus:border-secondary focus:ring-0"
              />
              <Icon name="search" className="absolute right-0 top-2 text-tertiary" />
            </div>
          </div>
        </div>
        <div className="mt-12 h-3 opacity-20 bg-[radial-gradient(#000_1px,transparent_0)] bg-[length:12px_12px]" aria-hidden="true" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {CATEGORIES.map((cat) => {
          const visibleItems = cat.items.filter(matches);
          if (q && visibleItems.length === 0) return null;
          return (
            <div key={cat.key} className="border-2 border-tertiary p-8 bg-surface hard-shadow relative">
              <div className="absolute -top-4 -left-4 bg-tertiary text-surface w-10 h-10 flex items-center justify-center font-display text-xl">
                {cat.number}
              </div>
              <h2 className="font-display text-headline-md border-b-2 border-tertiary pb-4 mb-8">{t(`faq.categories.${cat.key}`)}</h2>
              <div className="space-y-8">
                {(q ? visibleItems : cat.items).map((key) => (
                  <div key={key}>
                    <h3 className="font-label text-label-md uppercase mb-3 leading-tight">{t(`faq.items.${key}.question`)}</h3>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{t(`faq.items.${key}.answer`)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {q && CATEGORIES.every((cat) => cat.items.filter(matches).length === 0) && (
        <p className="text-center font-body text-body-lg text-on-surface-variant py-16">{t("faq.noResults")}</p>
      )}

      <section className="mt-24 border-t-2 border-tertiary pt-12 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/3 aspect-[4/5] border-2 border-tertiary overflow-hidden hard-shadow grayscale contrast-125">
          <img
            className="w-full h-full object-cover"
            src="/img/marketing/faq-library.webp"
            srcSet="/img/marketing/faq-library.webp 800w, /img/marketing/faq-library@2x.webp 1600w"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={800}
            height={1000}
          />
        </div>
        <div className="flex-1 space-y-6">
          <h2 className="font-display text-headline-lg italic">{t("faq.helpTitle")}</h2>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl">{t("faq.helpDescription")}</p>
          <NeoButton as={Link} to="/register" className="inline-flex items-center gap-2">
            {t("faq.helpCta")}
            <Icon name="arrow_forward" />
          </NeoButton>
        </div>
      </section>
    </div>
  );
}
