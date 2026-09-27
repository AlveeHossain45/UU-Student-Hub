import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const icons = {
  success: { Icon: CheckCircle2, cls: "text-emerald-500", bar: "bg-emerald-500" },
  error: { Icon: XCircle, cls: "text-red-500", bar: "bg-red-500" },
  info: { Icon: Info, cls: "text-brand-500", bar: "bg-brand-500" },
};

export default function ToastViewport({ toasts, onDismiss }) {
  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((t) => {
        const { Icon, cls, bar } = icons[t.type] || icons.info;
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative flex w-full max-w-sm animate-toast-in items-start gap-3 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3.5 pr-2.5 pl-4 shadow-pop dark:border-ink-600 dark:bg-ink-800"
          >
            <span className={cn("absolute inset-y-0 left-0 w-1", bar)} aria-hidden="true" />
            <Icon size={20} className={cn("mt-0.5 shrink-0", cls)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
