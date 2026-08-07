import { Component } from "react";
import { getStaticT } from "../lib/i18n.jsx";
import Icon from "./ui/Icon.jsx";

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.href = "/";
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
      <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile relative overflow-hidden">
        <div
          className="absolute top-1/4 left-10 w-32 h-32 border-2 border-primary rounded-full opacity-20 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-20 w-48 h-48 border-2 border-secondary rounded-full opacity-10 pointer-events-none"
          aria-hidden="true"
        />
        <div className="neo-card p-8 md:p-12 max-w-md text-center relative z-10">
          <Icon name="warning" className="text-secondary text-5xl mb-4" />
          <h1 className="font-display text-headline-lg mb-4">{t("errorBoundary.title")}</h1>
          <p className="font-body text-body-md text-on-surface-variant mb-8">{t("errorBoundary.description")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="inline-flex items-center justify-center gap-2 bg-surface text-primary border-2 border-tertiary px-6 py-3 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
              onClick={goBack}
            >
              <Icon name="arrow_back" className="text-lg" />
              {t("common.goBack")}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary border-2 border-tertiary px-6 py-3 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
              onClick={() => window.location.reload()}
            >
              <Icon name="sync" className="text-lg" />
              {t("common.tryAgain")}
            </button>
          </div>
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
      <div className="border-2 border-primary hard-shadow p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto bg-surface">
        <Icon name="warning" className="text-secondary text-4xl" />
        <h2 className="font-headline text-headline-md">{t("errorBoundary.title")}</h2>
        <p className="font-body text-body-md text-on-surface-variant">{t("errorBoundary.description")}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            className="inline-flex items-center justify-center gap-2 bg-surface text-primary border-2 border-tertiary px-6 py-3 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
            onClick={goBack}
          >
            <Icon name="arrow_back" className="text-lg" />
            {t("common.goBack")}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary border-2 border-tertiary px-6 py-3 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
            onClick={() => window.location.reload()}
          >
            <Icon name="sync" className="text-lg" />
            {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }
}
