import { cn } from "../../utils/cn";
import { initials } from "../../utils/helpers";

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-28 w-28 text-3xl",
};

export default function Avatar({ name = "", src, size = "md", className, ring = false }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white",
        ring && "ring-4 ring-white dark:ring-ink-900",
        sizes[size],
        className
      )}
      aria-label={name}
      role="img"
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
