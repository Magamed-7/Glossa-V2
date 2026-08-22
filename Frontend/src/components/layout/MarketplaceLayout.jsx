import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import MarketplaceSideNavBar from "./MarketplaceSideNavBar.jsx";
import MobileDrawer from "./MobileDrawer.jsx";
import TopAppBar from "./TopAppBar.jsx";
import { MARKET_NAV_ITEMS } from "../../lib/navigation.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useNotificationPolling } from "../../lib/useNotificationPolling.js";
import { useT } from "../../lib/i18n.jsx";

export default function MarketplaceLayout() {
  const t = useT();
  const { user: authUser, profile } = useAuth();
  const { hasUnread } = useNotificationPolling();
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const topBarUser =
    authUser && profile ? { username: authUser.username, photo_url: profile.photo_url } : undefined;

  return (
    <>
      {/* Marketplace Navigation Sidebar */}
      <MarketplaceSideNavBar />

      <MobileDrawer
        open={menuOpen}
        onClose={closeMenu}
        items={MARKET_NAV_ITEMS}
        balance={balance}
        hasUnread={hasUnread}
        title={`${t("market.titleLead")} ${t("market.titleAccent")}`}
      />

      {/* Main Container */}
      <main className="md:ml-64 min-h-screen relative overflow-x-clip bg-[#FAF8F5] dark:bg-[#151311] transition-colors duration-300">

        {/* Neubrutalist Dot Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Backdrop Glow Decoration */}
        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] max-w-[100vw] rounded-full bg-[#FDE2B6] dark:bg-stone-800 opacity-30 dark:opacity-10 blur-[120px] pointer-events-none" />

        <TopAppBar
          user={topBarUser}
          hasUnread={hasUnread}
          onOpenMenu={() => setMenuOpen(true)}
          onBalance={setBalance}
        />

        {/* Main Content Workspace viewport */}
        <div
          id="main-content"
          className="relative z-10 max-w-7xl mx-auto px-margin-mobile md:px-6 py-8 md:py-10 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-10"
        >
          <Outlet />
        </div>
      </main>
    </>
  );
}
