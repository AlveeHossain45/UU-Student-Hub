import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ToastViewport from "../components/ui/Toast";
import { uid } from "../utils/helpers";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (type, title, description) => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, type, title, description }]);
      timers.current[id] = setTimeout(() => dismiss(id), 3500);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
