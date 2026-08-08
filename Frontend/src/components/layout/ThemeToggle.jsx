import { useState } from "react";
import { useTheme } from "../../lib/theme.jsx";
import { useT } from "../../lib/i18n.jsx";
import Icon from "../ui/Icon.jsx";

const OPTIONS = [
  { value: "light", icon: "light_mode" },
  { value: "dark", icon: "dark_mode" },
  { value: "system", icon: "brightness_auto" },
];

export default function ThemeToggle({ className }) {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === theme) || OPTIONS[2];

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.changeTheme")}
        className={
          className ||
          "flex items-center gap-1.5 border-2 border-tertiary px-3 py-1.5 font-label text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
        }
      >
        <Icon name={current.icon} className="text-sm" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 border-2 border-tertiary bg-surface hard-shadow"
        >
          {OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  setTheme(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 font-label text-label-md transition-colors ${
                  o.value === theme ? "bg-secondary-container text-on-secondary-container" : "hover:bg-surface-container"
                }`}
              >
                <Icon name={o.icon} className="text-sm" />
                {t(`nav.theme${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}
                {o.value === theme && <Icon name="check" className="text-sm ml-auto" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
