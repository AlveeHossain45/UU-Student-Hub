import { Clock, MapPin, Pencil, Trash2, User2 } from "lucide-react";
import { cn } from "../utils/cn";
import { formatTime12 } from "../utils/helpers";
import Badge from "./ui/Badge";

/** A single class session. `state`: 'past' | 'ongoing' | 'next' | 'upcoming' */
export default function ClassCard({ cls, state = "upcoming", onEdit, onDelete, dense = false }) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border p-3.5 transition-all duration-200",
        state === "ongoing" || state === "next"
          ? "border-brand-200 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/[0.07]"
          : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-ink-700 dark:bg-ink-850 dark:hover:border-ink-600",
        state === "past" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-brand-600 dark:text-brand-400">{cls.courseCode}</span>
            {state === "ongoing" && (
              <Badge tone="green" dot>
                Live now
              </Badge>
            )}
            {state === "next" && <Badge tone="blue">Up next</Badge>}
          </div>
          <h4 className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{cls.courseName}</h4>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {onEdit && (
              <button
                onClick={() => onEdit(cls)}
                aria-label={`Edit ${cls.courseName}`}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(cls)}
                aria-label={`Delete ${cls.courseName}`}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className={cn("mt-2 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400", !dense && "sm:grid-cols-1")}>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} aria-hidden="true" />
          {formatTime12(cls.start)} – {formatTime12(cls.end)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={12} aria-hidden="true" />
          {cls.room}
        </span>
        {!dense && (
          <span className="inline-flex items-center gap-1.5 truncate">
            <User2 size={12} aria-hidden="true" />
            {cls.teacher}
          </span>
        )}
      </div>
    </div>
  );
}
