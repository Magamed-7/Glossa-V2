import { useId } from "react";

export default function TextArea({ label, error, marker = "bg-secondary", className = "", ...rest }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`relative group ${className}`}>
      <label className="block font-label text-label-md uppercase mb-2 flex items-center gap-2" htmlFor={id}>
        <span className={`w-2 h-2 ${marker}`} aria-hidden="true" />
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-surface-container-low border-2 px-4 py-4 font-body text-body-lg outline-none transition-colors focus:ring-0 placeholder:text-outline-variant ${
          error ? "border-error" : "border-tertiary focus:border-secondary"
        }`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-2 font-label text-label-md text-error">
          {error}
        </p>
      )}
    </div>
  );
}
