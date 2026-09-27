import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Generic dropdown.
 * trigger: ({ open, toggle }) => ReactNode
 * children: ReactNode | ({ close }) => ReactNode
 */
export default function Dropdown({ trigger, children, align = "right", className, panelClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-[200px] origin-top animate-scale-in rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-ink-600 dark:bg-ink-800 dark:shadow-black/40",
            align === "right" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, onClick, danger, active, className, shortcut }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-ink-700",
        active && "bg-zinc-100 font-medium text-zinc-900 dark:bg-ink-700 dark:text-white",
        className
      )}
    >
      {Icon && <Icon size={16} aria-hidden="true" className={danger ? "" : "text-zinc-500 dark:text-zinc-400"} />}
      <span className="flex-1">{children}</span>
      {shortcut && <kbd className="text-[10px] text-zinc-400">{shortcut}</kbd>}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1.5 h-px bg-zinc-100 dark:bg-ink-700" role="separator" />;
}
