import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { exportMyDataPdf } from "../../lib/api/account.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function DataExport() {
  const t = useT();
  const SECTIONS = t("settings.dataExport.sections");
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  async function onDownload() {
    setDownloading(true);
    try {
      const blob = await exportMyDataPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `glossa-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("settings.dataExport.success"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">{t("settings.dataExport.title")}</h3>
      <p className="font-body text-body-md text-on-surface-variant mb-4">{t("settings.dataExport.intro")}</p>
      <ul className="list-disc list-inside font-body text-body-md mb-6 space-y-1">
        {SECTIONS.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <NeoButton loading={downloading} onClick={onDownload}>
        {t("settings.dataExport.download")}
      </NeoButton>
    </NeoCard>
  );
}
