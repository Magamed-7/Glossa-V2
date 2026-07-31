import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { NAV_ITEMS } from "../../lib/navigation.js";
import { useT } from "../../lib/i18n.jsx";

export default function SideNavBar() {
  const t = useT();
  return (
    <aside className="fixed left-0 top-0 h-full flex-col p-gutter w-64 z-40 bg-surface border-r-2 border-tertiary shadow-[4px_0px_0px_0px_#dc2c4f] hidden md:flex">
      <div className="mb-12">
        <h1 className="font-display text-headline-lg text-tertiary leading-none italic">{t("loadingScreen.brand")}</h1>
        <p className="font-label text-label-md text-on-surface-variant uppercase tracking-widest mt-2">
          {t("nav.tagline")}
        </p>
      </div>
      <nav className="flex flex-col gap-1" aria-label={t("nav.primaryNav")}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 font-label text-label-md uppercase transition-colors ${
                isActive ? "text-secondary" : "text-on-surface-variant hover:text-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} />
                {t(item.labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
