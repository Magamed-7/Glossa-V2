import { Outlet } from "react-router-dom";
import SideNavBar from "./SideNavBar.jsx";
import TopAppBar from "./TopAppBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";
import Fab from "./Fab.jsx";

export default function AppLayout({ streak, hasUnread, user, fab }) {
  return (
    <>
      <SideNavBar />
      <main className="md:ml-64 min-h-screen relative overflow-hidden">
        <TopAppBar streak={streak} hasUnread={hasUnread} user={user} />
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 pb-24 md:pb-12">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      {fab && <Fab icon={fab.icon} label={fab.label} onClick={fab.onClick} />}
    </>
  );
}
