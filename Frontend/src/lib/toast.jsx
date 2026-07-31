import { createContext, useCallback, useContext, useRef, useState } from "react";
import Toast from "../components/ui/Toast.jsx";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message, variant = "info") => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, variant }]);

      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);

      return id;
    },
    [dismiss]
  );

  const pause = useCallback((id) => clearTimeout(timers.current.get(id)), []);
  const resume = useCallback(
    (id) => {
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 2000)
      );
    },
    [dismiss]
  );

  const api = {
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
    info: (message) => show(message, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-24 md:bottom-8 right-8 z-[60] flex flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onDismiss={() => dismiss(toast.id)}
            onMouseEnter={() => pause(toast.id)}
            onMouseLeave={() => resume(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
