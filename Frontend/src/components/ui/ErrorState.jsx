import Icon from "./Icon.jsx";
import NeoButton from "./NeoButton.jsx";
import { errorText } from "../../lib/api/errorText.js";
import { useT } from "../../lib/i18n.jsx";

export default function ErrorState({ error, onRetry }) {
  const t = useT();
  return (
    <div className="border-2 border-error p-8 flex flex-col items-center text-center gap-4">
      <Icon name="error" className="text-error text-4xl" />
      <p className="font-body text-body-md text-error">{errorText(error)}</p>
      {onRetry && (
        <NeoButton variant="ghost" size="md" onClick={onRetry}>
          {t("common.tryAgain")}
        </NeoButton>
      )}
    </div>
  );
}
