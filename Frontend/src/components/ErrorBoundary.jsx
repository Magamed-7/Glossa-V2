import { Component } from "react";
import { getStaticT } from "../lib/i18n.jsx";
import Icon from "./ui/Icon.jsx";

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.href = "/";
}

function TechnicalLog({ t }) {
  return (
    <div className="bg-surface-container-low border-2 border-primary p-6 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-secondary opacity-80 border border-primary" aria-hidden="true" />
      <h3 className="font-label text-label-md text-primary uppercase mb-4 border-b-2 border-primary pb-2 flex justify-between">
        <span>{t("errorBoundary.technicalNotes")}</span>
        <span className="text-secondary">#500</span>
      </h3>
      <div className="typewriter-text text-xs text-on-surface-variant space-y-2 opacity-80">
        <p>&gt; {t("errorBoundary.logInit")}</p>
        <p>&gt; {t("errorBoundary.logAccess")}</p>
        <p className="text-error font-bold">&gt; {t("errorBoundary.logFault")}</p>
        <p>&gt; {t("errorBoundary.logShutdown")}</p>
      </div>
    </div>
  );
}

function ErrorActions({ t }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-primary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto"
        onClick={goBack}
      >
        <Icon name="arrow_back" className="text-lg" />
        {t("common.goBack")}
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-label text-label-md uppercase border-2 border-primary hard-shadow hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all duration-150 w-full sm:w-auto"
        onClick={() => window.location.reload()}
      >
        <Icon name="sync" className="text-lg" />
        {t("common.tryAgain")}
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const t = getStaticT();

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile md:px-margin-desktop py-section-gap relative overflow-hidden dot-grid">
        <div
          className="absolute top-1/4 left-10 w-32 h-32 border-2 border-primary rounded-full opacity-20 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-20 w-48 h-48 border-2 border-secondary rounded-full opacity-10 pointer-events-none"
          aria-hidden="true"
        />
        <div className="w-full max-w-4xl bg-surface border-2 border-primary hard-shadow-lg p-8 md:p-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <Icon name="warning" className="text-secondary text-5xl" />
                <h2 className="font-headline text-headline-lg text-primary tracking-tight uppercase">
                  {t("errorBoundary.eyebrow")}
                </h2>
              </div>
              <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-6 leading-tight">
                {t("errorBoundary.title")}
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant mb-10 max-w-lg border-l-4 border-secondary pl-6">
                {t("errorBoundary.description")}
              </p>
              <ErrorActions t={t} />
            </div>
            <div className="md:col-span-5 flex flex-col justify-end mt-10 md:mt-0">
              <TechnicalLog t={t} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-secondary border-t-2 border-primary" aria-hidden="true" />
        </div>
      </div>
    );
  }
}

// Граница ошибок на уровне одного маршрута (App.jsx) — рендерится внутри содержимого
// страницы (внутри AppLayout для приватных маршрутов, внутри AuthLayout для публичных),
// поэтому фолбэк не на весь экран, а вписывается в контейнер как обычная карточка.
export class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const t = getStaticT();

    return (
      <div className="bg-surface border-2 border-primary hard-shadow p-6 md:p-8 relative max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="warning" className="text-secondary text-3xl" />
              <h2 className="font-headline text-headline-md text-primary uppercase">{t("errorBoundary.eyebrow")}</h2>
            </div>
            <p className="font-body text-body-md text-on-surface-variant mb-6 border-l-4 border-secondary pl-4">
              {t("errorBoundary.description")}
            </p>
            <ErrorActions t={t} />
          </div>
          <div className="md:col-span-5 mt-6 md:mt-0">
            <TechnicalLog t={t} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-secondary border-t-2 border-primary" aria-hidden="true" />
      </div>
    );
  }
}
