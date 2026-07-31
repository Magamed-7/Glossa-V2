import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const TOGGLE_KEYS = [
  { key: "ratings_enabled", i18nKey: "appearOnLeaderboards" },
  { key: "profile_visible", i18nKey: "publicProfile" },
];

export default function PrivacyPreferences() {
  const t = useT();
  const toast = useToast();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function onToggle(key) {
    const previous = settings;
    setSettings({ ...settings, [key]: !settings[key] });
    try {
      const updated = await updateSettings({ [key]: !previous[key] });
      setSettings(updated);
    } catch (err) {
      setSettings(previous);
      toast.error(errorText(err));
    }
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {TOGGLE_KEYS.map((toggle) => (
        <label key={toggle.key} className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={settings[toggle.key]} onChange={() => onToggle(toggle.key)} />
          <span>
            <span className="font-body text-body-md block">{t(`settings.privacy.${toggle.i18nKey}.label`)}</span>
            <span className="font-body text-body-md text-on-surface-variant text-sm">
              {t(`settings.privacy.${toggle.i18nKey}.description`)}
            </span>
          </span>
        </label>
      ))}
      <p className="font-label text-label-md text-on-surface-variant">
        {t("settings.privacy.finerControlPrefix")}
        <Link to="/profile" className="underline text-secondary">
          {t("settings.privacy.profilePrivacyLink")}
        </Link>
        .
      </p>
    </div>
  );
}
