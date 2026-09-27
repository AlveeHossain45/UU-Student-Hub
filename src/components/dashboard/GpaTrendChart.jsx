import { cn } from "../../utils/cn";

/** Lightweight, theme-aware bar chart (no chart library needed). */
export default function GpaTrendChart({ data, min = 2.5, max = 4 }) {
  const best = Math.max(...data.map((d) => d.gpa));
  return (
    <div>
      <div className="relative h-52">
        {/* grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pb-6" aria-hidden="true">
          {[4, 3.5, 3, 2.5].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="w-7 text-right text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">{v.toFixed(1)}</span>
              <span className="h-px flex-1 border-t border-dashed border-zinc-200 dark:border-ink-700" />
            </div>
          ))}
        </div>
        <ul className="absolute inset-0 left-9 flex items-end justify-between gap-2 pb-6 sm:gap-4" aria-label="GPA by semester">
          {data.map((d, i) => {
            const h = ((d.gpa - min) / (max - min)) * 100;
            const isBest = d.gpa === best;
            const isLast = i === data.length - 1;
            return (
              <li key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span className="pointer-events-none absolute z-10 rounded-lg bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-white dark:text-zinc-900" style={{ bottom: `calc(${Math.max(4, h)}% + 0.4rem)` }}>
                  {d.gpa.toFixed(2)}
                </span>
                <div
                  className={cn(
                    "w-full max-w-[44px] rounded-t-lg transition-all duration-500 group-hover:opacity-90",
                    isLast ? "bg-brand-600 dark:bg-brand-500" : isBest ? "bg-brand-400/80 dark:bg-brand-400/70" : "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-ink-600 dark:group-hover:bg-ink-500"
                  )}
                  style={{ height: `${Math.max(4, h)}%` }}
                  role="img"
                  aria-label={`${d.label}: GPA ${d.gpa.toFixed(2)}`}
                />
                <span className="absolute -bottom-5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{d.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
