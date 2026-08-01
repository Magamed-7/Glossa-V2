import { useId, useState } from "react";
import { useT } from "../../lib/i18n.jsx";
import Icon from "./Icon.jsx";

export default function Field({
  label,
  error,
  icon,
  marker = "bg-secondary",
  className = "",
  type,
  ...rest
}) {
  const t = useT();
  const id = useId();
  const errorId = `${id}-error`;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative group ${className}`}>
      <label className="block font-label text-label-md uppercase mb-2 flex items-center gap-2" htmlFor={id}>
        <span className={`w-2 h-2 ${marker}`} aria-hidden="true" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword ? (visible ? "text" : "password") : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full bg-surface-container-low border-2 px-4 py-4 font-body text-body-lg outline-none transition-colors focus:ring-0 placeholder:text-outline-variant ${
            isPassword ? "pr-12" : ""
          } ${error ? "border-error" : "border-tertiary focus:border-secondary"}`}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
            aria-pressed={visible}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <Icon name={visible ? "visibility_off" : "visibility"} className="text-tertiary" />
          </button>
        ) : (
          icon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
              <Icon name={icon} className="text-tertiary" />
            </span>
          )
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 font-label text-label-md text-error">
          {error}
        </p>
      )}
    </div>
  );
}
