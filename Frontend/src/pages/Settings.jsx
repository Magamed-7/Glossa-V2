import { useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Tabs from "../components/ui/Tabs.jsx";

const TABS = [
  { value: "learning", label: "Learning" },
  { value: "notifications", label: "Notifications" },
  { value: "privacy", label: "Privacy" },
  { value: "account", label: "Account" },
];

export default function Settings() {
  const [tab, setTab] = useState("learning");

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Settings" />
      <Tabs id="settings" tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-8 max-w-2xl">{/* Tab content goes here */}</div>
    </div>
  );
}
