import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import Toggle from "../ui/Toggle.jsx";
import Field from "../ui/Field.jsx";
import TelegramLink from "./TelegramLink.jsx";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const CHANNELS = [
  { key: "email_enabled", icon: "mail", i18nKey: "email" },
  { key: "push_enabled", icon: "notifications", i18nKey: "push" },
];

export default function NotificationSettings() {
  const t = useT();
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);

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

  async function onToggleReminder(next) {
    const nextTime = next ? reminderTime || "09:00" : "";
    setReminderTime(nextTime);
    try {
      const updated = await updateSettings({ reminder_time: nextTime || null });
      setSettings(updated);
    } catch (err) {
      toast.error(errorText(err));
    }
  }

  async function onSaveReminderTime() {
    setReminderSaving(true);
    try {
      const updated = await updateSettings({ reminder_time: reminderTime || null });
      setSettings(updated);
      toast.success(t("settings.notifications.saved"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setReminderSaving(false);
    }
  }

  if (!settings) return null;

  const reminderOn = Boolean(reminderTime);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CHANNELS.map((channel) => (
          <NeoCard key={channel.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Icon name={channel.icon} className="text-secondary text-xl" />
              <h3 className="font-headline text-headline-md">{t(`settings.notifications.${channel.i18nKey}`)}</h3>
            </div>
            <p className="font-body text-body-md text-on-surface-variant flex-1 mb-6">
              {t(`settings.notifications.${channel.i18nKey}Description`)}
            </p>
            <Toggle
              checked={settings[channel.key]}
              onChange={() => onToggle(channel.key)}
              label={t(`settings.notifications.${channel.i18nKey}`)}
            />
          </NeoCard>
        ))}
      </div>

      <p className="font-label text-label-md text-on-surface-variant">{t("settings.notifications.pushNotWiredUp")}</p>

      <NeoCard variant="accent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2">
            <Icon name="alarm" className="text-secondary text-xl mt-0.5" />
            <div>
              <h3 className="font-headline text-headline-md">{t("settings.notifications.reminderTitle")}</h3>
              <p className="font-body text-body-md text-on-surface-variant">
                {t("settings.notifications.reminderDescription")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Toggle checked={reminderOn} onChange={onToggleReminder} label={t("settings.notifications.reminderTitle")} />
            <Field
              className="w-36"
              type="time"
              value={reminderTime}
              disabled={!reminderOn}
              onChange={(e) => setReminderTime(e.target.value)}
              label={t("settings.notifications.reminderTimeLabel")}
            />
          </div>
        </div>
      </NeoCard>

      <div className="flex justify-end">
        <NeoButton size="md" loading={reminderSaving} onClick={onSaveReminderTime} disabled={!reminderOn}>
          {t("settings.notifications.save")}
        </NeoButton>
      </div>

      <NeoCard>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="send" className="text-secondary text-xl" />
          <h3 className="font-headline text-headline-md">{t("settings.notifications.telegramTitle")}</h3>
        </div>
        <TelegramLink />
      </NeoCard>
    </div>
  );
}
