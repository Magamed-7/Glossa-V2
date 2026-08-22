import { useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SideNavBar from "./SideNavBar.jsx";
import TopAppBar from "./TopAppBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";
import MobileDrawer from "./MobileDrawer.jsx";
import Fab from "./Fab.jsx";
import Icon from "../ui/Icon.jsx";
import { NAV_ITEMS } from "../../lib/navigation.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useNotificationPolling } from "../../lib/useNotificationPolling.js";
import { useT } from "../../lib/i18n.jsx";

export default function AppLayout({ fab }) {
  const t = useT();
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();
  const { hasUnread, activeToast, clearToast } = useNotificationPolling();
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const topBarUser =
    authUser && profile ? { username: authUser.username, photo_url: profile.photo_url } : undefined;

  return (
    <>
      <a href="#main-content" className="skip-link font-label text-label-md uppercase px-4 py-2">
        {t("nav.skipToContent")}
      </a>
      <SideNavBar />
      <MobileDrawer
        open={menuOpen}
        onClose={closeMenu}
        items={NAV_ITEMS}
        balance={balance}
        hasUnread={hasUnread}
      />
      <main className="md:ml-64 min-h-screen relative overflow-x-clip">
        <TopAppBar
          user={topBarUser}
          hasUnread={hasUnread}
          onOpenMenu={() => setMenuOpen(true)}
          onBalance={setBalance}
        />
        <div
          id="main-content"
          className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12"
        >
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      {fab && <Fab icon={fab.icon} label={fab.label} onClick={fab.onClick} />}

      {/* Real-time Push Toast Alert */}
      {activeToast && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 max-w-sm w-[90%] md:w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="neo-card bg-surface border-2 border-tertiary p-4 shadow-[6px_6px_0_0_#dc2c4f] relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-surface-variant/40">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-black text-white font-label text-[9px] uppercase font-bold tracking-widest">
                  [PUSH]
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  REG. NO. NTF-{activeToast.id}
                </span>
              </div>
              <button
                type="button"
                onClick={clearToast}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded p-0.5 transition-colors"
                aria-label="Close notification"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>

            {/* Clickable Content */}
            <div
              onClick={() => {
                let targetUrl = "/dashboard";
                if (activeToast.type === "review_reminder") {
                  targetUrl = "/deck";
                } else if (activeToast.type === "leaderboard_reset") {
                  targetUrl = "/leaderboard";
                } else if (activeToast.type === "achievement") {
                  targetUrl = "/profile";
                } else if (activeToast.type === "new_message") {
                  targetUrl = "/messenger";
                }
                navigate(targetUrl);
                clearToast();
              }}
              className="mt-3 cursor-pointer group"
            >
              <h4 className="font-headline text-sm font-bold uppercase tracking-tight text-on-surface group-hover:underline leading-snug">
                {activeToast.title}
              </h4>
              {activeToast.body && (
                <p className="font-body text-xs text-on-surface-variant leading-relaxed mt-1 line-clamp-2">
                  {activeToast.body}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
