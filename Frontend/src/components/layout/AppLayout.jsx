import { Outlet } from "react-router-dom";
import SideNavBar from "./SideNavBar.jsx";
import TopAppBar from "./TopAppBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";
import Fab from "./Fab.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useAppData } from "../../lib/AppDataContext.jsx";
import { useNotificationPolling } from "../../lib/useNotificationPolling.js";
import { useT } from "../../lib/i18n.jsx";

export default function AppLayout({ fab }) {
  const t = useT();
  const { user: authUser, profile } = useAuth();
  const { streak } = useAppData();
  const hasUnread = useNotificationPolling();

  const topBarUser =
    authUser && profile ? { username: authUser.username, photo_url: profile.photo_url } : undefined;

  return (
    <>
      <a href="#main-content" className="skip-link font-label text-label-md uppercase px-4 py-2">
        {t("nav.skipToContent")}
      </a>
      <SideNavBar />
      <main className="md:ml-64 min-h-screen relative overflow-hidden">
        <TopAppBar streak={streak?.current_streak} user={topBarUser} hasUnread={hasUnread} />
        <div id="main-content" className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 pb-24 md:pb-12">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      {fab && <Fab icon={fab.icon} label={fab.label} onClick={fab.onClick} />}
    </>
  );
}
