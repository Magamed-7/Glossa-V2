import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import Toggle from "../ui/Toggle.jsx";
import PrivacySettings from "../profile/PrivacySettings.jsx";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const TOGGLE_KEYS = [
  { key: "profile_visible", i18nKey: "publicProfile" },
  { key: "ratings_enabled", i18nKey: "appearOnLeaderboards" },
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
      <NeoCard>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="visibility" className="text-secondary text-xl" />
          <h3 className="font-headline text-headline-md">{t("settings.privacy.visibilityTitle")}</h3>
        </div>
        <div>
          {TOGGLE_KEYS.map((toggle, i) => (
            <div
              key={toggle.key}
              className={`flex items-center justify-between gap-6 py-4 ${
                i < TOGGLE_KEYS.length - 1 ? "border-b border-outline-variant" : ""
              }`}
            >
              <div>
                <span className="font-body text-body-md font-bold block">
                  {t(`settings.privacy.${toggle.i18nKey}.label`)}
                </span>
                <span className="font-body text-body-md text-on-surface-variant text-sm">
                  {t(`settings.privacy.${toggle.i18nKey}.description`)}
                </span>
              </div>
              <Toggle
                checked={settings[toggle.key]}
                onChange={() => onToggle(toggle.key)}
                label={t(`settings.privacy.${toggle.i18nKey}.label`)}
              />
            </div>
          ))}
        </div>
      </NeoCard>

      <PrivacySettings />
    </div>
  );
}
