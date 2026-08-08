import { Outlet } from "react-router-dom";
import MarketplaceSideNavBar from "./MarketplaceSideNavBar.jsx";
import TopAppBar from "./TopAppBar.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useNotificationPolling } from "../../lib/useNotificationPolling.js";

export default function MarketplaceLayout() {
  const { user: authUser, profile } = useAuth();
  const hasUnread = useNotificationPolling();

  const topBarUser =
    authUser && profile ? { username: authUser.username, photo_url: profile.photo_url } : undefined;

  return (
    <>
      {/* Marketplace Navigation Sidebar */}
      <MarketplaceSideNavBar />

      {/* Main Container */}
      <main className="md:ml-64 min-h-screen relative overflow-hidden bg-[#FAF8F5] dark:bg-[#151311] transition-colors duration-300">

        {/* Neubrutalist Dot Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Backdrop Glow Decoration */}
        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-[#FDE2B6] dark:bg-stone-800 opacity-30 dark:opacity-10 blur-[120px] pointer-events-none" />

        <TopAppBar user={topBarUser} hasUnread={hasUnread} />

        {/* Main Content Workspace viewport */}
        <div id="main-content" className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <Outlet />
        </div>
      </main>
    </>
  );
}
