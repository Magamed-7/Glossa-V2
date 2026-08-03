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

      <footer className="w-full border-t-2 border-tertiary bg-surface-container mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full px-margin-mobile md:px-margin-desktop py-section-gap max-w-7xl mx-auto gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="font-display text-headline-md italic text-primary tracking-tighter">Glossa</span>
            <p className="font-body text-body-md text-on-surface-variant text-center md:text-left max-w-xs">
              {t("public.footer.tagline")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex flex-col gap-4">
              <span className="font-label text-label-md uppercase text-primary border-b border-tertiary pb-2">
                {t("public.footer.navigation")}
              </span>
              <Link to="/#pricing" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.nav.pricing")}
              </Link>
              <Link to="/about" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.nav.about")}
              </Link>
              <Link to="/faq" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.nav.faq")}
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label text-label-md uppercase text-primary border-b border-tertiary pb-2">
                {t("public.footer.legal")}
              </span>
              <Link to="/privacy" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.footer.privacy")}
              </Link>
              <Link to="/terms" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.footer.terms")}
              </Link>
              <Link to="/contact" className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
                {t("public.footer.contact")}
              </Link>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="font-body text-body-md text-on-surface-variant">
              {t("public.footer.copyright")}
              <br />
              {t("public.footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
