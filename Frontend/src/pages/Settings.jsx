import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import LearningSettings from "../components/settings/LearningSettings.jsx";
import NotificationSettings from "../components/settings/NotificationSettings.jsx";
import PrivacyPreferences from "../components/settings/PrivacyPreferences.jsx";
import AccountSection from "../components/settings/AccountSection.jsx";
import LanguageSwitcher from "../components/layout/LanguageSwitcher.jsx";
import { useT } from "../lib/i18n.jsx";

export default function Settings() {
  const t = useT();
  const TABS = [
    { value: "learning", label: t("settings.tabs.learning") },
    { value: "notifications", label: t("settings.tabs.notifications") },
    { value: "privacy", label: t("settings.tabs.privacy") },
    { value: "account", label: t("settings.tabs.account") },
  ];
  const [tab, setTab] = useState("learning");

  return (
    <div>
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} actions={<LanguageSwitcher />} />
      <Tabs id="settings" tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-8 max-w-2xl">
        {tab === "learning" && <LearningSettings />}
        {tab === "notifications" && <NotificationSettings />}
        {tab === "privacy" && <PrivacyPreferences />}
        {tab === "account" && <AccountSection />}
      </div>
    </div>
  );
}
