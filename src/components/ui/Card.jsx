import { cn } from "../../utils/cn";

export default function Card({ as: Tag = "div", className, hover = false, children, ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white shadow-card dark:border-ink-700 dark:bg-ink-900 dark:shadow-none",
        hover &&
          "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-300/80 hover:shadow-card-hover dark:hover:border-ink-600",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, icon: Icon, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5 pb-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-ink-800 dark:text-zinc-300">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          {description && <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}
