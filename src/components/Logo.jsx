import { cn } from "../utils/cn";
import logoUrl from "../assets/logo.svg";

export default function Logo({ collapsed = false, className, light = false }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src={logoUrl} alt="" className="h-9 w-9 shrink-0" />
      {!collapsed && (
        <div className="leading-tight">
          <p className={cn("text-[15px] font-bold tracking-tight", light ? "text-white" : "text-zinc-900 dark:text-white")}>
            UU Student Hub
          </p>
          <p className={cn("text-[11px] font-medium", light ? "text-white/60" : "text-zinc-500 dark:text-zinc-400")}>Uttara University</p>
        </div>
      )}
    </div>
  );
}
