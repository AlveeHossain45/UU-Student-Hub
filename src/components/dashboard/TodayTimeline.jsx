import { Coffee } from "lucide-react";
import useNow from "../../hooks/useNow";
import { cn } from "../../utils/cn";
import { formatTime12, timeToMinutes } from "../../utils/helpers";
import ClassCard from "../ClassCard";
import EmptyState from "../ui/EmptyState";

export default function TodayTimeline({ routine }) {
  const now = useNow(30000);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = routine
    .filter((c) => Number(c.day) === now.getDay())
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  if (!today.length) {
    return <EmptyState compact icon={Coffee} title="No classes today" description="Enjoy your free day — or catch up on assignments." />;
  }

  const nextIdx = today.findIndex((c) => timeToMinutes(c.start) > nowMin);

  return (
    <ol className="relative space-y-3" aria-label="Today's classes">
      {today.map((c, i) => {
        const s = timeToMinutes(c.start);
        const e = timeToMinutes(c.end);
        const state = e <= nowMin ? "past" : s <= nowMin ? "ongoing" : i === nextIdx ? "next" : "upcoming";
        return (
          <li key={c.id} className="relative flex gap-3">
            <div className="flex w-[62px] shrink-0 flex-col items-end pt-3.5">
              <span className={cn("text-xs font-semibold tabular-nums", state === "past" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100")}>
                {formatTime12(c.start).replace(" ", "\u00a0")}
              </span>
            </div>
            <div className="relative flex flex-col items-center pt-4">
              <span
                className={cn(
                  "z-10 h-2.5 w-2.5 rounded-full ring-4",
                  state === "ongoing"
                    ? "bg-emerald-500 ring-emerald-500/20"
                    : state === "next"
                      ? "bg-brand-500 ring-brand-500/20"
                      : state === "past"
                        ? "bg-zinc-300 ring-transparent dark:bg-ink-500"
                        : "bg-white ring-zinc-200 dark:bg-ink-900 dark:ring-ink-600"
                )}
              />
              {i < today.length - 1 && <span className="absolute top-7 h-[calc(100%+0.25rem)] w-px bg-zinc-200 dark:bg-ink-700" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <ClassCard cls={c} state={state} dense />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
