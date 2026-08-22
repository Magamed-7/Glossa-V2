import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useT } from "../../lib/i18n.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function PublicLayout() {
  const t = useT();
  const { status } = useAuth();
  const authed = status === "authenticated";
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  function goToPricing(e) {
    setMenuOpen(false);
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <a href="#main-content" className="skip-link">
        {t("nav.skipToContent")}
      </a>

      <header className="border-b-2 border-tertiary relative">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between gap-3 md:gap-6">
          <Link to="/" className="font-display text-headline-md italic text-primary tracking-tighter shrink-0">
            Glossa
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-label text-label-md uppercase tracking-widest">
            <Link to="/#pricing" onClick={goToPricing} className="hover:text-secondary transition-colors">
              {t("public.nav.pricing")}
            </Link>
            <Link to="/about" className="hover:text-secondary transition-colors">
              {t("public.nav.about")}
            </Link>
            <Link to="/faq" className="hover:text-secondary transition-colors">
              {t("public.nav.faq")}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
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
                  className="font-label text-label-md uppercase tracking-widest hover:text-secondary transition-colors"
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

          {/* На телефоне «Зарегистрироваться» одно занимает полэкрана — всё уходит под кнопку меню. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={t("nav.openMenu")}
            className="md:hidden flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-tertiary" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t-2 border-tertiary bg-surface px-margin-mobile py-4 flex flex-col gap-3">
            <Link to="/#pricing" onClick={goToPricing} className="font-label text-label-md uppercase tracking-widest py-2">
              {t("public.nav.pricing")}
            </Link>
            <Link to="/about" className="font-label text-label-md uppercase tracking-widest py-2">
              {t("public.nav.about")}
            </Link>
            <Link to="/faq" className="font-label text-label-md uppercase tracking-widest py-2">
              {t("public.nav.faq")}
            </Link>

            <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
              <ThemeToggle className="flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0" />
              <LanguageSwitcher />
            </div>

            {authed ? (
              <Link
                to="/dashboard"
                className="border-2 border-tertiary bg-secondary text-on-secondary px-4 py-3 text-center font-label text-label-md uppercase tracking-widest break-words"
              >
                {t("public.nav.dashboard")}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="border-2 border-tertiary px-4 py-3 text-center font-label text-label-md uppercase tracking-widest break-words"
                >
                  {t("public.nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-tertiary bg-secondary text-on-secondary px-4 py-3 text-center font-label text-label-md uppercase tracking-widest break-words"
                >
                  {t("public.nav.register")}
                </Link>
              </div>
            )}
          </div>
        )}
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
              <Link to="/#pricing" onClick={goToPricing} className="font-body text-body-md text-on-surface-variant hover:underline decoration-2 decoration-secondary">
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
