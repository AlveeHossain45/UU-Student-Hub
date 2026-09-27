import { Link } from "react-router-dom";
import { Clock, MapPin, User2, CalendarX2, ArrowRight } from "lucide-react";
import useNow from "../../hooks/useNow";
import { DAYS, formatTime12, getNextClass, humanCountdown, pad, splitDuration } from "../../utils/helpers";

function Digit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[52px] rounded-xl border border-white/10 bg-white/[0.06] px-2 py-2 text-center text-2xl font-bold tabular-nums tracking-tight sm:min-w-[60px] sm:text-3xl">
        {pad(value)}
      </span>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</span>
    </div>
  );
}

export default function NextClassCard({ routine }) {
  const now = useNow(1000);
  const next = getNextClass(routine, now);

  const shell =
    "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-xl shadow-zinc-900/10 sm:p-7 dark:border-ink-600 dark:bg-ink-800 dark:shadow-black/30";

  if (!next) {
    return (
      <div className={shell}>
        <div className="bg-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-start justify-center py-6">
          <CalendarX2 size={28} className="text-white/50" />
          <h2 className="mt-4 text-xl font-semibold">No classes scheduled</h2>
          <p className="mt-1 text-sm text-white/60">Add your weekly classes to see a live countdown here.</p>
          <Link to="/routine" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100">
            Set up routine <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const { cls, start, end, status, offset } = next;
  const ongoing = status === "ongoing";
  const target = ongoing ? end : start;
  const remaining = target - now;
  const d = splitDuration(remaining);
  const total = end - start;
  const pct = ongoing ? Math.min(100, Math.max(0, ((now - start) / total) * 100)) : 0;
  const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : DAYS[start.getDay()];

  return (
    <div className={shell} aria-live="polite">
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />

      <div className="relative flex h-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${ongoing ? "bg-emerald-400" : "bg-brand-400"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${ongoing ? "bg-emerald-400" : "bg-brand-400"}`} />
              </span>
              {ongoing ? "Happening now" : "Next class"}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">{dayLabel}</span>
          </div>

          <p className="mt-5 text-sm font-semibold text-brand-300">{cls.courseCode}</p>
          <h2 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{cls.courseName}</h2>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} aria-hidden="true" /> {formatTime12(cls.start)} – {formatTime12(cls.end)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} aria-hidden="true" /> {cls.room}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User2 size={15} aria-hidden="true" /> Instructor: {cls.teacher}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <p className="mb-2.5 text-sm font-medium text-white/80">
            {ongoing ? `In progress · ends in ${humanCountdown(remaining)}` : `Starts in ${humanCountdown(remaining)}`}
          </p>
          <div className="flex gap-2" role="timer" aria-label={ongoing ? "Time until class ends" : "Time until class starts"}>
            {d.days > 0 && <Digit value={d.days} label="Days" />}
            <Digit value={d.hours} label="Hrs" />
            <Digit value={d.minutes} label="Min" />
            <Digit value={d.seconds} label="Sec" />
          </div>
        </div>
      </div>

      {ongoing && (
        <div className="relative mt-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-right text-[11px] text-white/50">{Math.round(pct)}% complete</p>
        </div>
      )}
    </div>
  );
}
