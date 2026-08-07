import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";

export default function MarketplaceSideNavBar() {
  const t = useT();
  const { user, profile } = useAuth();

  const username = user?.username || "Polyglot Pro";
  const avatarUrl = profile?.photo_url || "/avatar-placeholder.png";

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-6 w-64 z-40 bg-[#FAF8F5] dark:bg-[#1C1A17] border-r-2 border-black dark:border-stone-800 transition-colors duration-300 hidden md:flex">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col">
        <div className="flex items-center gap-2 text-[#E32652]">
          <Icon name="storefront" className="text-2xl text-[#E32652]" />
          <h1 className="font-display text-xl font-black uppercase leading-none tracking-tight">
            Glossa <span className="italic font-serif font-normal text-black dark:text-white lowercase">Market</span>
          </h1>
        </div>
        <p className="font-label text-[10px] text-gray-500 uppercase tracking-widest mt-2">
          Lingo Services Hub
        </p>
        <hr className="mt-4 border-black dark:border-stone-800" />
      </div>

      {/* Profile Header Block */}
      <div className="flex items-center gap-3 mb-8 p-2 border-2 border-black dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a]">
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
            {t("nav.welcomeBack") || "Welcome back"}
          </span>
          <span className="text-sm font-bold text-black dark:text-stone-100 font-sans truncate uppercase tracking-tight">
            {username}
          </span>
        </div>
      </div>

      {/* Marketplace Navigation Menu */}
      <nav className="flex flex-col gap-2" aria-label="Marketplace Navigation">
        {/* Marketplace Directory */}
        <NavLink
          to="/marketplace"
          end
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
              <Icon name="storefront" filled={isActive} className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
              {t("market.directory") || "Marketplace"}
            </>
          )}
        </NavLink>

        {/* Analytics */}
        <NavLink
          to="/marketplace/analytics"
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
              <Icon name="analytics" filled={isActive} className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
              {t("market.analytics") || "Analytics"}
            </>
          )}
        </NavLink>

        {/* My Services */}
        <NavLink
          to="/marketplace/services"
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
              <Icon name="work" filled={isActive} className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
              {t("market.myServices") || "My Services"}
            </>
          )}
        </NavLink>

        {/* Inbox */}
        <NavLink
          to="/marketplace/inbox"
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
              <Icon name="inbox" filled={isActive} className={isActive ? "text-white" : "text-black dark:text-stone-300"} />
              {t("market.inbox") || "Inbox"}
            </>
          )}
        </NavLink>
      </nav>

      {/* Sidebar Bottom links */}
      <div className="mt-auto pt-4 border-t border-gray-300 dark:border-stone-800 flex flex-col gap-2">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-2 font-label text-xs uppercase font-bold tracking-wider text-black dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <Icon name="settings" className="text-black dark:text-stone-300" />
          {t("nav.settings")}
        </NavLink>

        <NavLink
          to="/faq"
          className="flex items-center gap-3 px-4 py-2 font-label text-xs uppercase font-bold tracking-wider text-black dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <Icon name="help" className="text-black dark:text-stone-300" />
          {t("nav.support") || "Support"}
        </NavLink>
        
        {/* Return to Glossa link */}
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-2 font-label text-xs uppercase font-bold tracking-wider text-[#E32652] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-dashed border-[#E32652] shadow-[2px_2px_0px_#E32652]"
        >
          <Icon name="arrow_back" className="text-[#E32652]" />
          {t("market.return") || "Return to Glossa"}
        </NavLink>
      </div>
    </aside>
  );
}
