import { Component } from "react";
import { getStaticT } from "../lib/i18n.jsx";

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
      <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile">
        <div className="neo-card p-8 md:p-12 max-w-md text-center">
          <h1 className="font-display text-headline-lg mb-4">{t("errorBoundary.title")}</h1>
          <p className="font-body text-body-md text-on-surface-variant mb-8">{t("errorBoundary.description")}</p>
          <button
            className="bg-secondary text-on-secondary border-2 border-tertiary px-8 py-4 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
            onClick={() => window.location.reload()}
          >
            {t("common.reload")}
          </button>
        </div>
      </div>
    );
  }
}
