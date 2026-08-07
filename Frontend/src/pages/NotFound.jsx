import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";

export default function NotFound() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile relative overflow-hidden">
      <div
        className="absolute top-1/4 left-10 w-64 h-64 border-2 border-secondary rounded-full opacity-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-20 w-96 h-96 bg-secondary-fixed rounded-full opacity-30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 text-center max-w-md">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="w-12 h-[2px] bg-secondary inline-block" aria-hidden="true" />
          <p className="font-label text-label-md uppercase tracking-widest text-secondary">{t("notFound.eyebrow")}</p>
          <span className="w-12 h-[2px] bg-secondary inline-block" aria-hidden="true" />
        </div>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-none">{t("notFound.title")}</h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-10">{t("notFound.description")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 bg-surface text-primary border-2 border-tertiary px-8 py-4 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
          >
            <Icon name="arrow_back" className="text-lg" />
            {t("common.goBack")}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary border-2 border-tertiary px-8 py-4 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
          >
            <Icon name="sync" className="text-lg" />
            {t("common.tryAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
