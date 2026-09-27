import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-1 ring-inset ring-white/15 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/35 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600 dark:ring-white/10",
  secondary:
    "bg-zinc-900 text-white shadow-md shadow-zinc-900/15 ring-1 ring-inset ring-white/10 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-none dark:ring-black/5 dark:hover:bg-zinc-200",
  outline:
    "border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-200 dark:hover:bg-ink-700 dark:hover:border-ink-500",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-ink-700 dark:hover:text-zinc-100",
  subtle: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-500/10 hover:bg-brand-100 hover:text-brand-800 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
  danger: "bg-red-600 text-white shadow-md shadow-red-600/25 ring-1 ring-inset ring-white/15 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-xl",
  "icon-sm": "h-8 w-8 rounded-lg",
};

export function buttonClasses({ variant = "primary", size = "md", className } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    variants[variant],
    sizes[size],
    className
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  type = "button",
  disabled,
  ...props
}) {
  const iconSize = size === "sm" || size === "icon-sm" ? 14 : 16;
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses({ variant, size, className })} {...props}>
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden="true" />}
    </button>
  );
}
