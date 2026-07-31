import { Link } from "react-router-dom";
import { useT } from "../lib/i18n.jsx";

export default function NotFound() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile relative overflow-hidden">
      <div className="absolute top-20 right-[-100px] w-[600px] h-[600px] rounded-full border border-tertiary opacity-5 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 text-center max-w-md">
        <p className="font-label text-label-md uppercase tracking-widest text-secondary mb-4">{t("notFound.eyebrow")}</p>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg mb-6 leading-none">{t("notFound.title")}</h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-10">{t("notFound.description")}</p>
        <Link
          className="inline-block bg-secondary text-on-secondary border-2 border-tertiary px-8 py-4 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
          to="/"
        >
          {t("notFound.action")}
        </Link>
      </div>
    </div>
  );
}
