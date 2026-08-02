import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useT } from "../../lib/i18n.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function PublicLayout() {
  const t = useT();
  const { status } = useAuth();
  const authed = status === "authenticated";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <a href="#main-content" className="skip-link">
        {t("nav.skipToContent")}
      </a>

      <header className="border-b-2 border-tertiary">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between gap-6">
          <Link to="/" className="font-display text-headline-md italic text-primary tracking-tighter">
            Glossa
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-label text-label-md uppercase tracking-widest">
            <Link to="/#pricing" className="hover:text-secondary transition-colors">
              {t("public.nav.pricing")}
            </Link>
            <Link to="/about" className="hover:text-secondary transition-colors">
              {t("public.nav.about")}
            </Link>
            <Link to="/faq" className="hover:text-secondary transition-colors">
              {t("public.nav.faq")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            {authed ? (
              <Link
                to="/dashboard"
                className="border-2 border-tertiary bg-secondary text-on-secondary px-4 py-1.5 font-label text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                {t("public.nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline font-label text-label-md uppercase tracking-widest hover:text-secondary transition-colors"
                >
                  {t("public.nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-tertiary bg-secondary text-on-secondary px-4 py-1.5 font-label text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  {t("public.nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t-2 border-tertiary">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-label text-label-md text-on-surface-variant">{t("public.footer.copyright")}</span>
          <nav className="flex items-center gap-6 font-label text-label-md uppercase tracking-widest">
            <Link to="/#pricing" className="hover:text-secondary transition-colors">
              {t("public.nav.pricing")}
            </Link>
            <Link to="/about" className="hover:text-secondary transition-colors">
              {t("public.nav.about")}
            </Link>
            <Link to="/faq" className="hover:text-secondary transition-colors">
              {t("public.nav.faq")}
            </Link>
            <Link to="/login" className="hover:text-secondary transition-colors">
              {t("public.nav.login")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
