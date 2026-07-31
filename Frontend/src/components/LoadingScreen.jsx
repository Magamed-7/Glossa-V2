import { useT } from "../lib/i18n.jsx";

export default function LoadingScreen() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <h1 className="font-display text-headline-lg text-tertiary italic">{t("loadingScreen.brand")}</h1>
    </div>
  );
}
