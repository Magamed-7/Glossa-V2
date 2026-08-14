import { useState } from "react";
import { Link } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import Toggle from "../ui/Toggle.jsx";
import { getTelegramLink, unlinkTelegram } from "../../lib/api/account.js";
import { getMySubscription } from "../../lib/api/subscriptions.js";
import { getMyProfile } from "../../lib/api/profile.js";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { useApi } from "../../lib/useApi.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function TelegramLink() {
  const t = useT();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Fetch subscription, profile, and settings using useApi
  const { data: subscription, loading: subLoading } = useApi(() => getMySubscription(), []);
  const { data: profile, loading: profileLoading, reload: reloadProfile } = useApi(() => getMyProfile(), []);
  const { data: settings, loading: settingsLoading, reload: reloadSettings } = useApi(() => getSettings(), []);

  async function onLink() {
    setSubmitting(true);
    try {
      const { link } = await getTelegramLink();
      window.open(link, "_blank", "noopener");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onUnlink() {
    if (!window.confirm(t("telegram.unlinkConfirm"))) return;
    setUnlinking(true);
    try {
      await unlinkTelegram();
      toast.success(t("telegram.successUnlinked"));
      await reloadProfile();
      await reloadSettings();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setUnlinking(false);
    }
  }

  async function handleSettingChange(key, value) {
    setSettingsSaving(true);
    try {
      await updateSettings({ [key]: value });
      await reloadSettings();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSettingsSaving(false);
    }
  }

  const loading = subLoading || profileLoading || settingsLoading;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-secondary/10 rounded border border-primary/10"></div>
        <div className="h-10 w-full bg-secondary/10 rounded border border-primary/10"></div>
      </div>
    );
  }

  if (subscription && !subscription.plan.telegram_access) {
    return (
      <div>
        <p className="font-body text-body-md text-on-surface-variant mb-4">
          {t("settings.telegram.requiresPlan")}
        </p>
        <Link to="/pricing">
          <NeoButton variant="ghost">{t("settings.telegram.viewPlans")}</NeoButton>
        </Link>
      </div>
    );
  }

  const isLinked = profile && Boolean(profile.telegram_chat_id);

  if (!isLinked) {
    return (
      <div className="space-y-4">
        <p className="font-body text-body-md text-on-surface-variant">
          {t("settings.notifications.telegramDescription")}
        </p>
        <NeoButton loading={submitting} onClick={onLink}>
          {t("settings.telegram.link")}
        </NeoButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected status banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-2 border-primary bg-background shadow-neo-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-headline text-headline-sm">{t("telegram.connected")}</span>
        </div>
        <span className="px-2 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500">
          {t("telegram.activeBadge")}
        </span>
      </div>

      {/* Bot Interface Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-primary/10">
        <div>
          <label htmlFor="telegram-lang-select" className="font-headline text-headline-sm block mb-1">
            {t("telegram.languageLabel")}
          </label>
          <p className="font-body text-body-sm text-on-surface-variant">
            {settings?.telegram_language ? "Custom Telegram locale overrides main language." : "Defaults to your main profile language."}
          </p>
        </div>
        <select
          id="telegram-lang-select"
          value={settings?.telegram_language || settings?.interface_language || "en"}
          onChange={(e) => handleSettingChange("telegram_language", e.target.value)}
          disabled={settingsSaving}
          className="w-full sm:w-48 bg-background border-2 border-primary p-2 font-mono text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer shadow-neo-sm"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="tg">Тоҷикӣ</option>
        </select>
      </div>

      {/* SM-2 Word Repetitions Toggle */}
      <div className="flex items-center justify-between gap-4 py-4 border-b border-primary/10">
        <div className="pr-4">
          <span className="font-headline text-headline-sm block mb-1">
            {t("telegram.sm2Label")}
          </span>
          <p className="font-body text-body-sm text-on-surface-variant">
            Receive reminders tailored specifically to your spaced repetition queue.
          </p>
        </div>
        <Toggle
          id="telegram-sm2-toggle"
          checked={Boolean(settings?.telegram_sm2_enabled)}
          onChange={(checked) => handleSettingChange("telegram_sm2_enabled", checked)}
          disabled={settingsSaving}
          label={t("telegram.sm2Label")}
        />
      </div>

      {/* Unlink Button */}
      <div className="pt-2 flex justify-start">
        <NeoButton
          variant="ghost"
          className="border-secondary text-secondary hover:bg-secondary/5"
          loading={unlinking}
          onClick={onUnlink}
        >
          {t("telegram.unlinkButton")}
        </NeoButton>
      </div>
    </div>
  );
}
