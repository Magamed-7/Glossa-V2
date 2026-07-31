import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const ITEMS = [
  { to: "/", labelKey: "nav.home", icon: "home", end: true },
  { to: "/deck", labelKey: "nav.library", icon: "library_books" },
  { to: "/stories", labelKey: "nav.stories", icon: "auto_stories" },
  { to: "/tutor", labelKey: "nav.tutor", icon: "smart_toy" },
];

export default function MobileBottomNav() {
  const t = useT();
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface border-t-2 border-tertiary md:hidden z-50 flex justify-around items-center py-3">
      {ITEMS.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-secondary" : "text-on-surface-variant"}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} />
              <span className="text-[10px] font-bold uppercase">{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
      <NavLink
        to="/deck?new=1"
        className="flex flex-col items-center text-on-surface-variant"
        aria-label={t("nav.addNewWord")}
      >
        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center -translate-y-4 border-2 border-tertiary shadow-md">
          <Icon name="add" className="text-on-secondary" />
        </div>
      </NavLink>
      {ITEMS.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-secondary" : "text-on-surface-variant"}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} />
              <span className="text-[10px] font-bold uppercase">{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
