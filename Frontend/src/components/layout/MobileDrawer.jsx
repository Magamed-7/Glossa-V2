import { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { formatMoney } from "../../lib/format.js";

/**
 * Всё меню целиком — для телефона.
 *
 * На широком экране разделы живут в боковой панели, а рядом с логотипом помещается ещё
 * восемь кнопок. На экране в 390 точек не помещается ни то, ни другое, поэтому здесь
 * лежит всё сразу: разделы, кошелёк с остатком, сообщения, уведомления, настройки, тема,
 * язык и выход.
 */
export default function MobileDrawer({ open, onClose, items, balance, hasUnread, title }) {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Ушли на другой раздел — меню больше не нужно.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Пока меню открыто, страница под ним не ездит.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function onLogout() {
    logout();
    window.location.href = "/";
  }

  function onSearch(e) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (!query) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 font-label text-xs uppercase font-bold tracking-wider border transition-colors min-w-0 ${
      isActive
        ? "bg-secondary text-on-secondary border-tertiary"
        : "text-on-surface border-transparent hover:bg-surface-container"
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-[86%] max-w-[320px] bg-surface border-r-2 border-tertiary md:hidden flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label={t("nav.primaryNav")}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b-2 border-tertiary shrink-0">
          <span className="font-display text-xl font-black uppercase tracking-tight text-tertiary truncate">
            {title || t("loadingScreen.brand")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0"
          >
            <Icon name="close" className="text-tertiary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto neo-scroll overscroll-contain">
          <Link
            to="/profile"
            className="flex items-center gap-3 m-4 p-3 border-2 border-tertiary bg-surface-container-low min-w-0"
          >
            <Avatar photoUrl={profile?.photo_url} name={user?.username} shape="square" size="md" eager />
            <span className="flex flex-col min-w-0">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant leading-none">
                {t("nav.myProfile")}
              </span>
              <span className="font-body text-body-md font-bold truncate">{user?.username || "—"}</span>
            </span>
          </Link>

          <form onSubmit={onSearch} className="flex items-center gap-2 px-4 pb-4">
            <input
              type="search"
              name="q"
              className="flex-1 min-w-0 h-11 bg-surface-container-low border-2 border-tertiary px-3 font-body text-base outline-none focus:border-secondary"
              placeholder={t("nav.searchPlaceholder")}
              aria-label={t("nav.searchInMenu")}
            />
            <button
              type="submit"
              aria-label={t("nav.submitSearch")}
              className="flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0"
            >
              <Icon name="search" className="text-secondary" />
            </button>
          </form>

          <nav className="flex flex-col gap-1 px-3 pb-2">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} filled={isActive} className="shrink-0" />
                    <span className="min-w-0 break-words">{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-2 pt-2 px-3 pb-4 border-t border-outline-variant flex flex-col gap-1">
            <NavLink to="/wallet" className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon name="account_balance_wallet" filled={isActive} className="shrink-0" />
                  <span className="min-w-0 break-words">{t("nav.wallet")}</span>
                  <span className="ml-auto font-ledger text-xs shrink-0">
                    {balance ? formatMoney(balance.balance) : "…"}
                  </span>
                </>
              )}
            </NavLink>

            <NavLink to="/notifications" className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon name="notifications" filled={isActive} className="shrink-0" />
                  <span className="min-w-0 break-words">{t("nav.notifications")}</span>
                  {hasUnread && <span className="ml-auto w-2 h-2 rounded-full bg-secondary shrink-0" />}
                </>
              )}
            </NavLink>

            <NavLink to="/settings" className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon name="settings" filled={isActive} className="shrink-0" />
                  <span className="min-w-0 break-words">{t("nav.settings")}</span>
                </>
              )}
            </NavLink>
          </div>
        </div>

        <div className="shrink-0 border-t-2 border-tertiary p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2">
          <ThemeToggle className="flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0" />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onLogout}
            className="ml-auto flex items-center gap-2 px-3 h-11 border-2 border-tertiary text-secondary font-label text-xs uppercase font-bold tracking-wider min-w-0"
          >
            <Icon name="logout" className="text-secondary shrink-0" />
            <span className="truncate">{t("nav.logOut")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
