import { Calendar, Pin } from "lucide-react";
import Badge, { CATEGORY_META } from "./ui/Badge";
import { cn } from "../utils/cn";
import { formatDate } from "../utils/helpers";

export default function NoticeCard({ notice, onClick, compact = false }) {
  const tone = CATEGORY_META[notice.category]?.tone || "gray";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2xl border text-left transition-all duration-200",
        compact ? "border-transparent p-3 hover:bg-zinc-50 dark:hover:bg-ink-800" : "border-zinc-200/80 bg-white p-4 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-200/40 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 dark:hover:shadow-black/20"
      )}
    >
      <span
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", notice.read ? "bg-transparent" : "bg-brand-500")}
        aria-label={notice.read ? undefined : "Unread"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={tone}>{notice.category}</Badge>
          {notice.pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Pin size={11} aria-hidden="true" /> Pinned
            </span>
          )}
        </div>
        <h3
          className={cn(
            "mt-1.5 text-sm leading-snug text-zinc-900 dark:text-zinc-50",
            notice.read ? "font-medium" : "font-semibold",
            compact && "line-clamp-2"
          )}
        >
          {notice.title}
        </h3>
        {!compact && <p className="mt-1 line-clamp-2 text-[13px] text-zinc-500 dark:text-zinc-400">{notice.description}</p>}
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <Calendar size={12} aria-hidden="true" />
          {formatDate(notice.date)}
        </p>
      </div>
    </button>
  );
}
