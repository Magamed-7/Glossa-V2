import { useEffect, useId, useRef } from "react";
import Icon from "./Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children }) {
  const t = useT();
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    triggerRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll(FOCUSABLE);
    focusable?.[0]?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-tertiary/40 flex items-center justify-center p-margin-mobile">
      <div
        ref={panelRef}
        className="neo-card hard-shadow-lg p-8 max-w-lg w-full relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          className="absolute top-4 right-4"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <Icon name="close" />
        </button>
        <h2 id={titleId} className="font-headline text-headline-md mb-6 pr-8">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
