import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import NeoButton from "./NeoButton.jsx";
import { errorText } from "../../lib/api/errorText.js";
import { useT } from "../../lib/i18n.jsx";

function TechnicalLog({ t, error }) {
  return (
    <div className="bg-surface-container-low border-2 border-primary p-6 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-secondary opacity-80 border border-primary" aria-hidden="true" />
      <h3 className="font-label text-label-md text-primary uppercase mb-4 border-b-2 border-primary pb-2 flex justify-between">
        <span>{t("errorBoundary.technicalNotes")}</span>
        <span className="text-secondary">#{error?.status || "ERR"}</span>
      </h3>
      <div className="typewriter-text text-xs text-on-surface-variant space-y-2 opacity-80">
        <p>&gt; {t("errorBoundary.logInit")}</p>
        <p>&gt; {t("errorBoundary.logAccess")}</p>
        <p className="text-error font-bold">&gt; {error?.code || t("errorBoundary.logFault")}</p>
        <p>&gt; {t("errorBoundary.logShutdown")}</p>
      </div>
    </div>
  );
}

function ErrorActions({ t, onRetry }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-primary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <Icon name="arrow_back" className="text-lg" />
        {t("common.goBack")}
      </button>
      {onRetry && (
        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto cursor-pointer"
          onClick={onRetry}
        >
          <Icon name="sync" className="text-lg" />
          {t("common.tryAgain")}
        </button>
      )}
    </div>
  );
}

// Полностраничный вариант — тот же визуальный язык, что у RouteErrorBoundary/NotFound,
// чтобы неудачная загрузка данных не выглядела как голая карточка на пустой странице.
function PageErrorState({ error, onRetry }) {
  const t = useT();

  return (
    <div className="bg-surface border-2 border-primary hard-shadow p-6 md:p-8 relative max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="error" className="text-secondary text-3xl" />
            <h2 className="font-headline text-headline-md text-primary uppercase">{t("errorBoundary.eyebrow")}</h2>
          </div>
          <p className="font-body text-body-md text-on-surface-variant mb-6 border-l-4 border-secondary pl-4">
            {errorText(error)}
          </p>
          <ErrorActions t={t} onRetry={onRetry} />
        </div>
        <div className="md:col-span-5 mt-6 md:mt-0">
          <TechnicalLog t={t} error={error} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-secondary border-t-2 border-primary" aria-hidden="true" />
    </div>
  );
}

// Компактный вариант — для мелких карточек дашборда, где полностраничная карточка не поместится.
function InlineErrorState({ error, onRetry }) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="border-2 border-error p-8 flex flex-col items-center text-center gap-4">
      <Icon name="error" className="text-error text-4xl" />
      <p className="font-body text-body-md text-error">{errorText(error)}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <NeoButton variant="ghost" size="md" onClick={() => navigate(-1)}>
          {t("common.goBack")}
        </NeoButton>
        {onRetry && (
          <NeoButton variant="ghost" size="md" onClick={onRetry}>
            {t("common.tryAgain")}
          </NeoButton>
        )}
      </div>
    </div>
  );
}

export default function ErrorState({ error, onRetry, variant = "page" }) {
  if (variant === "inline") return <InlineErrorState error={error} onRetry={onRetry} />;
  return <PageErrorState error={error} onRetry={onRetry} />;
}
