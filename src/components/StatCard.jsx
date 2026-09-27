import { cn } from "../utils/cn";
import Card from "./ui/Card";

const tones = {
  blue: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  gray: "bg-zinc-100 text-zinc-600 dark:bg-ink-800 dark:text-zinc-300",
};

const glows = {
  blue: "bg-brand-500/[0.14] dark:bg-brand-400/[0.12]",
  green: "bg-emerald-500/[0.14] dark:bg-emerald-400/[0.12]",
  amber: "bg-amber-500/[0.16] dark:bg-amber-400/[0.12]",
  violet: "bg-violet-500/[0.14] dark:bg-violet-400/[0.12]",
  red: "bg-red-500/[0.14] dark:bg-red-400/[0.12]",
  gray: "bg-zinc-400/[0.14] dark:bg-zinc-500/[0.12]",
};

const bars = {
  blue: "from-brand-400 to-brand-600",
  green: "from-emerald-400 to-emerald-600",
  amber: "from-amber-400 to-amber-600",
  violet: "from-violet-400 to-violet-600",
  red: "from-red-400 to-red-600",
  gray: "from-zinc-400 to-zinc-600",
};

export default function StatCard({ label, value, suffix, icon: Icon, tone = "blue", hint, trend, progress, className, style }) {
  return (
    <Card hover className={cn("group relative overflow-hidden p-5", className)} style={style}>
      <span className={cn("pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full blur-2xl", glows[tone])} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        {Icon && (
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105", tones[tone])}>
            <Icon size={19} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="relative mt-2 text-[28px] font-bold leading-none tracking-tight text-zinc-900 tabular-nums dark:text-white">
        {value}
        {suffix && <span className="ml-0.5 text-base font-semibold text-zinc-400">{suffix}</span>}
      </p>
      {typeof progress === "number" && (
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-ink-700" aria-hidden="true">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out", bars[tone])}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {(hint || trend) && (
        <p className="relative mt-2.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {trend && (
            <span className={cn("font-semibold", trend.startsWith("-") ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
              {trend}
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  );
}
