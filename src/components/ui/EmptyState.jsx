import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 text-center dark:border-ink-600/80",
        compact ? "px-4 py-8" : "px-6 py-14",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-100 to-zinc-50 text-zinc-400 ring-1 ring-inset ring-zinc-200/60 dark:from-ink-800 dark:to-ink-850 dark:text-zinc-500 dark:ring-white/5">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
