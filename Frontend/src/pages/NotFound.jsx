import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";

export default function NotFound() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile md:px-margin-desktop py-section-gap relative overflow-hidden dot-grid">
      {/* Декоративные элементы фона */}
      <div
        className="absolute top-1/4 left-10 w-64 h-64 border-2 border-dashed border-secondary rounded-full opacity-20 pointer-events-none animate-[spin_60s_linear_infinite]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-20 w-96 h-96 bg-secondary-fixed rounded-full opacity-30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Карточка 404 */}
      <div className="max-w-4xl w-full bg-surface-container-lowest border-2 border-primary p-8 md:p-16 relative hard-shadow-lg mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center z-10">
        {/* Архивный штамп */}
        <div className="absolute -top-6 -right-6 w-32 h-32 border-4 border-secondary text-secondary rounded-full flex items-center justify-center rotate-12 bg-surface-container-lowest z-10 hard-shadow opacity-90">
          <div className="text-center">
            <span className="block text-[10px] uppercase font-bold tracking-widest border-b border-secondary pb-1 mb-1">
              {t("notFound.statusLabel")}
            </span>
            <span className="block font-headline text-2xl leading-none font-bold italic">{t("notFound.voidStamp")}</span>
          </div>
        </div>

        {/* Колонка контента */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-6 md:pr-8 z-10">
          <div className="flex items-center gap-4">
            <span className="w-12 h-[2px] bg-secondary inline-block" aria-hidden="true" />
            <span className="typewriter-text text-sm text-secondary font-bold">{t("notFound.eyebrow")}</span>
          </div>

          <h1
            className="font-headline text-display-lg-mobile md:text-display-lg font-semibold text-primary leading-tight glitch-wrapper"
            data-text={t("notFound.title")}
          >
            {t("notFound.title")}
          </h1>
          <h2 className="font-headline text-headline-md text-on-surface-variant italic -mt-4">{t("notFound.subheading")}</h2>

          <p className="font-body text-body-lg text-on-surface-variant max-w-lg border-l-4 border-primary pl-4 py-2 bg-surface-container-low">
            {t("notFound.description")}
          </p>

          <div className="typewriter-text text-xs text-outline">
            {t("notFound.fileRef")}: {typeof window !== "undefined" ? window.location.pathname : "/"}
            <br />
            {t("notFound.lastSeen")}: {new Date().toISOString()}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-primary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto"
            >
              <Icon name="arrow_back" className="text-lg" />
              {t("common.goBack")}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto"
            >
              <Icon name="sync" className="text-lg" />
              {t("common.tryAgain")}
            </button>
          </div>
        </div>

        {/* Визуальная колонка */}
        <div className="md:col-span-5 relative h-64 md:h-full min-h-[300px] flex items-center justify-center border-t-2 md:border-t-0 md:border-l-2 border-primary border-dashed pt-8 md:pt-0">
          <Icon
            name="auto_stories"
            className="text-[220px] text-primary opacity-10 mix-blend-multiply"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
