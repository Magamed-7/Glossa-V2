import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useApi } from "../lib/useApi.js";
import { getPlans } from "../lib/api/subscriptions.js";
import { formatMoney, formatLimit, formatSeconds } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import Icon from "../components/ui/Icon.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import PlanComparison from "../components/pricing/PlanComparison.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";

const ROMAN = ["I", "II", "III", "IV", "V"];

const STATS = [
  { value: "3", key: "languages" },
  { value: "A1–C2", key: "levels" },
  { value: "4", key: "scenarios" },
  { value: "3", key: "plans" },
];

const FEATURES = [
  { icon: "auto_stories", key: "stories" },
  { icon: "menu_book", key: "grammar" },
  { icon: "smart_toy", key: "tutor" },
];

function planFeatures(plan, t) {
  const items = [
    { ok: true, label: t("landing.pricing.feature.storiesPerDay", { n: formatLimit(plan.stories_per_day) }) },
    { ok: true, label: t("landing.pricing.feature.wordsPerDay", { n: formatLimit(plan.deck_words_per_day) }) },
    { ok: true, label: t("landing.pricing.feature.ownStoriesPerWeek", { n: formatLimit(plan.own_stories_per_week) }) },
    plan.ai_seconds_per_day === 0
      ? { ok: false, label: t("landing.pricing.feature.noAiTutor") }
      : { ok: true, label: t("landing.pricing.feature.aiTutor", { n: plan.ai_seconds_per_day === null ? "∞" : formatSeconds(plan.ai_seconds_per_day) }) },
    { ok: plan.can_buy_stories, label: t("landing.pricing.feature.marketplace") },
    { ok: plan.telegram_access, label: t("landing.pricing.feature.telegram") },
  ];
  return items;
}

export default function Landing() {
  const t = useT();
  const { status } = useAuth();
  const authed = status === "authenticated";
  const { data: plans, loading } = useApi(() => getPlans(), []);

  return (
    <div>
      <section className="relative overflow-hidden border-b-2 border-tertiary">
        <DecorativeBackground variant="rays" />
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 md:py-28 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7 flex flex-col items-start gap-8">
            <span className="bg-secondary text-on-secondary px-3 py-1 font-label text-label-md uppercase tracking-widest border-2 border-tertiary">
              {t("landing.hero.eyebrow")}
            </span>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg leading-tight">
              {t("landing.hero.titleLine1")}
              <br />
              {t("landing.hero.titleLine2")}
              <br />
              <span className="italic font-normal text-secondary">{t("landing.hero.titleLine3")}</span>
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant max-w-lg">{t("landing.hero.description")}</p>
            <div className="flex flex-wrap gap-4">
              {authed ? (
                <NeoButton as={Link} to="/dashboard" className="flex items-center gap-2">
                  {t("public.nav.dashboard")}
                </NeoButton>
              ) : (
                <>
                  <NeoButton as={Link} to="/register" className="flex items-center gap-2">
                    {t("landing.hero.cta")}
                    <Icon name="arrow_forward" />
                  </NeoButton>
                  <NeoButton as={Link} to="/about" variant="ghost">
                    {t("landing.hero.secondaryCta")}
                  </NeoButton>
                </>
              )}
            </div>
          </div>
          <div className="md:col-span-5 relative mt-12 md:mt-0">
            <div className="border-2 border-tertiary p-2 bg-surface-container-low hard-shadow relative z-10 rotate-2 overflow-hidden">
              <img
                className="w-full aspect-[720/760] object-cover grayscale contrast-125"
                src="/img/marketing/landing-typewriter.webp"
                srcSet="/img/marketing/landing-typewriter.webp 720w, /img/marketing/landing-typewriter@2x.webp 1440w"
                alt=""
                aria-hidden="true"
                loading="eager"
                width={720}
                height={760}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-full h-full border-2 border-tertiary bg-secondary opacity-10 -z-10 -rotate-3" />
          </div>
        </div>
      </section>

      <section className="py-16 border-b-2 border-tertiary bg-surface-container">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-gutter text-center">
          {STATS.map((s) => (
            <div key={s.key} className="flex flex-col gap-2">
              <span className="font-display text-headline-lg">{s.value}</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant">{t(`landing.stats.${s.key}`)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-headline text-headline-lg mb-12 text-center">{t("landing.features.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.key} className="neo-card p-8">
              <div className="w-10 h-10 border-2 border-tertiary flex items-center justify-center mb-4">
                <Icon name={f.icon} />
              </div>
              <h3 className="font-headline text-headline-md mb-2">{t(`landing.features.${f.key}.title`)}</h3>
              <p className="font-body text-body-md text-on-surface-variant">{t(`landing.features.${f.key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap" id="pricing">
        <div className="text-center mb-16 flex flex-col items-center gap-4">
          <h2 className="font-display text-display-lg">{t("landing.pricing.title")}</h2>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">{t("landing.pricing.subtitle")}</p>
        </div>

        {loading && <Skeleton className="h-96" />}

        {!loading && plans && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {plans.map((plan, index) => {
              const isPopular = plan.code === "premium";
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col gap-6 p-8 border-2 border-tertiary bg-surface relative ${
                    isPopular ? "hard-shadow-crimson lg:scale-105" : "hard-shadow"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-4 py-1.5 font-label text-label-md uppercase tracking-widest border-2 border-tertiary whitespace-nowrap">
                      {t("landing.pricing.mostPopular")}
                    </span>
                  )}
                  <div>
                    <span className={`font-label text-label-md uppercase tracking-widest ${isPopular ? "text-secondary" : "text-on-surface-variant"}`}>
                      {t("landing.pricing.level", { n: ROMAN[index] || index + 1 })}
                    </span>
                    <h3 className="font-headline text-headline-md uppercase capitalize">{plan.code}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-display text-headline-lg">{formatMoney(plan.price_monthly)}</span>
                      <span className="font-body text-body-md text-on-surface-variant">{t("landing.pricing.perMonth")}</span>
                    </div>
                  </div>
                  <hr className="border-tertiary opacity-20" />
                  <ul className="flex flex-col gap-3 font-body text-body-md flex-1">
                    {planFeatures(plan, t).map((item, i) => (
                      <li key={i} className={`flex items-center gap-3 ${item.ok ? "" : "text-on-surface-variant opacity-50"}`}>
                        <Icon name={item.ok ? "check" : "close"} className={item.ok ? "text-secondary" : ""} />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                  <NeoButton as={Link} to="/register" variant={isPopular ? "primary" : "ghost"} className="w-full text-center">
                    {t("landing.pricing.cta")}
                  </NeoButton>
                </div>
              );
            })}
          </div>
        )}

        {!loading && plans && (
          <div className="mt-section-gap">
            <h3 className="font-display text-headline-lg mb-8">{t("landing.pricing.comparisonTitle")}</h3>
            <PlanComparison plans={plans} />
          </div>
        )}
      </section>

      {!authed && (
        <section className="border-t-2 border-tertiary bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center">
            <h2 className="font-headline text-headline-lg mb-6">
              {t("landing.ctaBanner.titleLead")} <span className="italic text-secondary">{t("landing.ctaBanner.titleAccent")}</span>
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant max-w-xl mx-auto mb-10">{t("landing.ctaBanner.description")}</p>
            <NeoButton as={Link} to="/register" className="inline-flex items-center gap-2">
              {t("landing.ctaBanner.cta")}
              <Icon name="arrow_forward" />
            </NeoButton>
          </div>
        </section>
      )}
    </div>
  );
}
