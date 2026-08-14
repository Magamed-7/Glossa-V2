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
        <div className="h-6 w-32 bg-[#24A1DE]/10 rounded border border-primary/10"></div>
        <div className="h-24 w-full bg-[#24A1DE]/10 rounded border border-primary/10"></div>
      </div>
    );
  }

  if (subscription && !subscription.plan.telegram_access) {
    return (
      <div className="p-5 border-2 border-primary bg-stone-100 dark:bg-stone-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-body text-body-md text-on-surface-variant mb-4 font-bold">
          ⚠️ {t("settings.telegram.requiresPlan")}
        </p>
        <Link to="/pricing">
          <NeoButton variant="primary">{t("settings.telegram.viewPlans")}</NeoButton>
        </Link>
      </div>
    );
  }

  const isLinked = profile && Boolean(profile.telegram_chat_id);

  if (!isLinked) {
    return (
      <div className="bg-gradient-to-br from-[#0088cc] via-[#24A1DE] to-[#34B7F1] text-white p-6 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <span className="font-label text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded border border-white/20 leading-none">
            Telegram Bot
          </span>
          <h4 className="font-display text-headline-md font-bold uppercase tracking-tight">
            {t("settings.notifications.telegramTitle")}
          </h4>
          <p className="font-body text-body-md opacity-95 max-w-lg leading-relaxed font-semibold">
            {t("settings.notifications.telegramDescription")}
          </p>
        </div>
        <div className="shrink-0 w-full md:w-auto relative z-10">
          <button
            onClick={onLink}
            disabled={submitting}
            className="w-full md:w-auto bg-white hover:bg-stone-100 text-[#0088cc] font-label text-label-md uppercase tracking-widest font-bold px-6 py-3.5 border-2 border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? "..." : (
              <>
                <span>✈️</span>
                {t("settings.telegram.link")}
              </>
            )}
          </button>
        </div>
        {/* Decorative large absolute paper airplane */}
        <div className="absolute right-[-10px] bottom-[-20px] opacity-10 text-[160px] font-bold select-none pointer-events-none rotate-12">
          ✈️
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected status banner in Telegram Blue gradient */}
      <div className="bg-gradient-to-br from-[#0088cc] via-[#24A1DE] to-[#34B7F1] text-white p-5 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full border-2 border-primary bg-white flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ✈️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-display text-headline-sm font-bold uppercase tracking-tight">
                {t("telegram.connected")}
              </span>
            </div>
            <p className="font-body text-body-sm opacity-90 mt-0.5 font-semibold">
              Your profile is actively linked to Glossa Telegram bot.
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative z-10">
          {t("telegram.activeBadge")}
        </span>
        {/* Decorative subtle airplane background */}
        <div className="absolute right-4 bottom-[-30px] opacity-10 text-9xl select-none pointer-events-none rotate-12">
          ✈️
        </div>
      </div>

      {/* Preferences Sub-card */}
      <div className="bg-[#FAF8F5] dark:bg-stone-900 border-2 border-primary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
        {/* Language select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary/20">
          <div className="space-y-0.5">
            <label htmlFor="telegram-lang-select" className="font-headline text-body-lg block font-bold">
              🌐 {t("telegram.languageLabel")}
            </label>
            <p className="font-body text-body-sm text-on-surface-variant">
              {settings?.telegram_language 
                ? "Custom Telegram locale overrides main language." 
                : "Defaults to your main profile language."}
            </p>
          </div>
          <select
            id="telegram-lang-select"
            value={settings?.telegram_language || settings?.interface_language || "en"}
            onChange={(e) => handleSettingChange("telegram_language", e.target.value)}
            disabled={settingsSaving}
            className="w-full sm:w-48 bg-white dark:bg-stone-950 border-2 border-primary p-2 font-mono text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="tg">Тоҷикӣ</option>
          </select>
        </div>

        {/* SM-2 reminders toggle */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-primary/20">
          <div className="pr-4 space-y-0.5">
            <span className="font-headline text-body-lg block font-bold">
              ⏰ {t("telegram.sm2Label")}
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

        {/* Unlink button */}
        <div className="pt-2 flex justify-start">
          <button
            disabled={unlinking}
            onClick={onUnlink}
            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-label text-label-xs uppercase tracking-widest font-bold px-4 py-2 border-2 border-rose-600/40 dark:border-rose-400/40 rounded transition-colors shadow-[2px_2px_0px_0px_rgba(220,38,38,0.1)] hover:shadow-[3px_3px_0px_0px_rgba(220,38,38,0.2)] active:translate-y-[1px]"
          >
            ❌ {t("telegram.unlinkButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
