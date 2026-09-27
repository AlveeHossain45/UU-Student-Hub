import { cn } from "../../utils/cn";

const tones = {
  gray: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-ink-700/60 dark:text-zinc-300 dark:ring-ink-600",
  blue: "bg-brand-50 text-brand-700 ring-brand-200/70 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  red: "bg-red-50 text-red-700 ring-red-200/70 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200/70 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20",
};

const dots = {
  gray: "bg-zinc-400",
  blue: "bg-brand-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  purple: "bg-violet-500",
  cyan: "bg-cyan-500",
};

export default function Badge({ tone = "gray", dot = false, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const STATUS_META = {
  pending: { label: "Pending", tone: "amber" },
  "in-progress": { label: "In Progress", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
};

export const PRIORITY_META = {
  low: { label: "Low", tone: "gray" },
  medium: { label: "Medium", tone: "amber" },
  high: { label: "High", tone: "red" },
};

export const CATEGORY_META = {
  Academic: { tone: "blue" },
  Exam: { tone: "red" },
  Registration: { tone: "purple" },
  General: { tone: "gray" },
  Event: { tone: "green" },
};
