import { useState } from "react";
import { LANGS, useI18n, useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { updateSettings } from "../../lib/api/settings.js";
import Icon from "../ui/Icon.jsx";

export default function LanguageSwitcher() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  function selectLang(code) {
    setLang(code);
    setOpen(false);
    if (status === "authenticated") updateSettings({ interface_language: code }).catch(() => {});
  }

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
        aria-label={t("nav.changeLanguage")}
        className="flex items-center gap-1.5 border-2 border-tertiary px-3 py-1.5 font-label text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
      >
        <Icon name="language" className="text-sm" />
        {current.label}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 border-2 border-tertiary bg-surface hard-shadow"
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => selectLang(l.code)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 font-label text-label-md transition-colors ${
                  l.code === lang ? "bg-secondary-container text-on-secondary-container" : "hover:bg-surface-container"
                }`}
              >
                {l.name}
                {l.code === lang && <Icon name="check" className="text-sm" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
