import { NavLink, Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { NAV_ITEMS } from "../../lib/navigation.js";
import { useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";

export default function SideNavBar() {
  const t = useT();
  const { user, profile, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const username = user?.username || "Polyglot Pro";
  const avatarUrl = profile?.photo_url || "/avatar-placeholder.png";

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-6 w-64 z-40 bg-[#FAF8F5] dark:bg-[#1C1A17] border-r-2 border-black dark:border-stone-800 transition-colors duration-300 hidden md:flex">
      {/* Profile Header Block */}
      <Link
        to="/profile"
        className="flex items-center gap-3 mb-8 p-2 border-2 border-black dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a] hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors cursor-pointer"
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-10 h-10 rounded-full border border-black dark:border-stone-800 object-cover"
          onError={(e) => {
            e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=" + username;
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-gray-500 dark:text-stone-400 font-label uppercase tracking-widest leading-none">
            {t("market.welcomeBack") || "Welcome back"}
          </span>
          <span className="text-sm font-bold text-black dark:text-stone-100 font-sans truncate uppercase tracking-tight">
            {username}
          </span>
        </div>
      </Link>

      {/* Brand Label */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-black dark:text-white uppercase leading-none tracking-tight">
          Glossa <span className="text-[#E32652]">App</span>
        </h1>
        <hr className="mt-4 border-black dark:border-stone-800" />
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-2" aria-label={t("nav.primaryNav")}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-label text-xs uppercase font-bold tracking-wider transition-all border ${
                isActive
                  ? "bg-[#E32652] text-white border-black shadow-[3px_3px_0px_#000000]"
                  : "text-black dark:text-stone-300 border-transparent hover:border-black dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
                {t(item.labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer links */}
      <div className="mt-auto pt-4 border-t border-gray-300 dark:border-stone-800 flex flex-col gap-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 font-label text-xs uppercase font-bold tracking-wider transition-all border ${
              isActive
                ? "bg-[#E32652] text-white border-black shadow-[2px_2px_0px_#000000]"
                : "text-black dark:text-stone-300 border-transparent hover:border-black dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name="settings" className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
              {t("nav.settings")}
            </>
          )}
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 font-label text-xs uppercase font-bold tracking-wider text-[#E32652] hover:bg-stone-100 dark:hover:bg-stone-800 text-left transition-colors"
        >
          <Icon name="logout" className="text-[#E32652]" />
          {t("nav.logOut") || "Log Out"}
        </button>
      </div>
    </aside>
  );
}
