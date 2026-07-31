import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const TOGGLES = [
  { key: "ratings_enabled", label: "Appear on leaderboards", description: "Include your score in rankings." },
  { key: "profile_visible", label: "Public profile", description: "Let others view your profile page." },
];

export default function PrivacyPreferences() {
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
      {TOGGLES.map((toggle) => (
        <label key={toggle.key} className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={settings[toggle.key]} onChange={() => onToggle(toggle.key)} />
          <span>
            <span className="font-body text-body-md block">{toggle.label}</span>
            <span className="font-body text-body-md text-on-surface-variant text-sm">{toggle.description}</span>
          </span>
        </label>
      ))}
      <p className="font-label text-label-md text-on-surface-variant">
        For finer control over what appears on your profile (streak, achievements, followers), see{" "}
        <Link to="/profile" className="underline text-secondary">
          Profile privacy
        </Link>
        .
      </p>
    </div>
  );
}
