import { Link } from "react-router-dom";
import { useT } from "../../lib/i18n.jsx";
import Icon from "../ui/Icon.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthLayout({ children, cancelTo }) {
  const t = useT();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-margin-mobile relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] ray-pattern animate-[spin_120s_linear_infinite]" />
      </div>
      {cancelTo && (
        <div className="absolute top-6 left-6 z-20">
          <Link
            to={cancelTo}
            className="flex items-center gap-1.5 border-2 border-tertiary px-3 py-1.5 font-label text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" className="text-sm" />
            {t("common.cancel") || "Cancel"}
          </Link>
        </div>
      )}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 w-full flex justify-center">{children}</div>
      <div className="fixed bottom-8 left-margin-desktop hidden md:block max-w-[200px]" aria-hidden="true">
        <p className="font-label text-label-md text-navy/40 leading-relaxed">{t("auth.layoutNotice")}</p>
      </div>
    </div>
  );
}
