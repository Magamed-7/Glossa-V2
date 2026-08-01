import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useT } from "../lib/i18n.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import Icon from "../components/ui/Icon.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";

const FEATURES = [
  { icon: "auto_stories", key: "stories", image: "/img/covers/midnight-cafe.webp" },
  { icon: "menu_book", key: "grammar", image: "/img/textures/linguistic-blueprint.webp" },
  { icon: "smart_toy", key: "tutor", image: "/img/scenarios/interview.webp" },
];

export default function Landing() {
  const t = useT();
  const { status } = useAuth();
  const authed = status === "authenticated";

  return (
    <div>
      <section className="relative overflow-hidden border-b-2 border-tertiary">
        <DecorativeBackground variant="rays" />
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 md:py-32 relative z-10">
          <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-6">
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-8 max-w-3xl leading-tight">
            {t("landing.hero.title")}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-xl mb-10">
            {t("landing.hero.description")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {authed ? (
              <NeoButton as={Link} to="/dashboard">
                {t("public.nav.dashboard")}
              </NeoButton>
            ) : (
              <>
                <NeoButton as={Link} to="/register" className="flex items-center gap-2">
                  {t("landing.hero.cta")}
                  <Icon name="arrow_forward" />
                </NeoButton>
                <NeoButton as={Link} to="/login" variant="ghost">
                  {t("public.nav.login")}
                </NeoButton>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h2 className="font-headline text-headline-lg mb-12 text-center">{t("landing.features.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.key} className="neo-card overflow-hidden">
              <div className="h-40 overflow-hidden border-b-2 border-tertiary">
                <img src={f.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 border-2 border-tertiary flex items-center justify-center mb-4">
                  <Icon name={f.icon} />
                </div>
                <h3 className="font-headline text-headline-md mb-2">{t(`landing.features.${f.key}.title`)}</h3>
                <p className="font-body text-body-md text-on-surface-variant">
                  {t(`landing.features.${f.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!authed && (
        <section className="border-t-2 border-tertiary bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-16 text-center">
            <h2 className="font-headline text-headline-lg mb-6">{t("landing.ctaBanner.title")}</h2>
            <NeoButton as={Link} to="/register" className="inline-flex items-center gap-2">
              {t("landing.hero.cta")}
              <Icon name="arrow_forward" />
            </NeoButton>
          </div>
        </section>
      )}
    </div>
  );
}
