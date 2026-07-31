import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { exportMyData } from "../../lib/api/account.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const SECTIONS = [
  "Profile & privacy settings",
  "Languages & learning settings",
  "Streak history",
  "Word deck",
  "Achievements",
  "Subscription & wallet",
  "Notifications",
  "Your authored stories (including drafts)",
  "Social connections",
  "Account details",
];

export default function DataExport() {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  async function onDownload() {
    setDownloading(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `glossa-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">Export Your Data</h3>
      <p className="font-body text-body-md text-on-surface-variant mb-4">Your download will include:</p>
      <ul className="list-disc list-inside font-body text-body-md mb-6 space-y-1">
        {SECTIONS.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <NeoButton loading={downloading} onClick={onDownload}>
        Download My Data
      </NeoButton>
    </NeoCard>
  );
}
