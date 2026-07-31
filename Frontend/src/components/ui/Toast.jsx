import Icon from "./Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const VARIANT_ICON = {
  success: "check_circle",
  error: "error",
  info: "info",
};

const VARIANT_BORDER = {
  success: "border-tertiary",
  error: "border-error",
  info: "border-tertiary",
};

export default function Toast({ variant = "info", onDismiss, children, ...rest }) {
  const t = useT();
  return (
    <div
      className={`neo-card ${VARIANT_BORDER[variant]} p-4 pr-10 flex items-center gap-3 max-w-sm relative`}
      {...rest}
    >
      <Icon name={VARIANT_ICON[variant]} className={variant === "error" ? "text-error" : "text-secondary"} />
      <p className="font-body text-body-md">{children}</p>
      <button className="absolute top-2 right-2" onClick={onDismiss} aria-label={t("common.dismissNotification")}>
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  );
}
