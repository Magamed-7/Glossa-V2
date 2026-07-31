import { useId } from "react";
import Icon from "./Icon.jsx";

export default function Select({ label, error, marker = "bg-secondary", className = "", children, ...rest }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`relative group ${className}`}>
      <label className="block font-label text-label-md uppercase mb-2 flex items-center gap-2" htmlFor={id}>
        <span className={`w-2 h-2 ${marker}`} aria-hidden="true" />
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full appearance-none bg-surface-container-low border-2 px-4 py-4 font-body text-body-lg outline-none transition-colors focus:ring-0 ${
            error ? "border-error" : "border-tertiary focus:border-secondary"
          }`}
          {...rest}
        >
          {children}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
          <Icon name="expand_more" className="text-tertiary" />
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 font-label text-label-md text-error">
          {error}
        </p>
      )}
    </div>
  );
}
