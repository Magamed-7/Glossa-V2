import { useEffect, useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import TelegramLink from "./TelegramLink.jsx";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const TOGGLE_KEYS = [
  { key: "email_enabled", i18nKey: "email" },
  { key: "push_enabled", i18nKey: "push" },
  { key: "telegram_enabled", i18nKey: "telegram" },
];

export default function NotificationSettings() {
  const t = useT();
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setReminderTime(data.reminder_time || "");
    });
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

  async function onSaveReminder() {
    setSubmitting(true);
    try {
      const updated = await updateSettings({ reminder_time: reminderTime || null });
      setSettings(updated);
      toast.success(t("settings.notifications.saved"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {TOGGLE_KEYS.map((toggle) => (
        <label key={toggle.key} className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={settings[toggle.key]} onChange={() => onToggle(toggle.key)} />
          <span className="font-body text-body-md">{t(`settings.notifications.${toggle.i18nKey}`)}</span>
        </label>
      ))}
      <p className="font-label text-label-md text-on-surface-variant">{t("settings.notifications.pushNotWiredUp")}</p>

      <div className="flex items-end gap-4">
        <Field
          label={t("settings.notifications.reminderTimeLabel")}
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
        />
        <NeoButton size="md" loading={submitting} onClick={onSaveReminder}>
          {t("settings.notifications.save")}
        </NeoButton>
      </div>

      <div className="pt-6 border-t-2 border-surface-container-highest">
        <h3 className="font-headline text-headline-md mb-4">{t("settings.notifications.telegramTitle")}</h3>
        <TelegramLink />
      </div>
    </div>
  );
}
