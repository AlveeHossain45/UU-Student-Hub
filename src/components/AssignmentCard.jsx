import { Calendar, Check, MoreHorizontal, Pencil, Trash2, CheckCircle2, RotateCcw, Flag } from "lucide-react";
import Card from "./ui/Card";
import Badge, { PRIORITY_META, STATUS_META } from "./ui/Badge";
import Dropdown, { DropdownItem, DropdownSeparator } from "./ui/Dropdown";
import { cn } from "../utils/cn";
import { formatDateTime, getAssignmentStatus, relativeTime } from "../utils/helpers";

export default function AssignmentCard({ assignment, now = new Date(), onToggle, onEdit, onDelete, compact = false }) {
  const status = getAssignmentStatus(assignment, now);
  const s = STATUS_META[status];
  const p = PRIORITY_META[assignment.priority] || PRIORITY_META.medium;
  const done = status === "completed";

  return (
    <Card className={cn("group p-4 transition-colors", compact && "rounded-xl p-3.5 shadow-none", done && "opacity-80")}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle?.(assignment)}
          aria-label={done ? `Mark "${assignment.title}" as not completed` : `Mark "${assignment.title}" as completed`}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-300 hover:border-brand-500 dark:border-ink-500 dark:hover:border-brand-400"
          )}
        >
          {done && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-brand-600 dark:text-brand-400">{assignment.course}</span>
            <Badge tone={s.tone} dot>
              {s.label}
            </Badge>
            {!compact && (
              <Badge tone={p.tone}>
                <Flag size={10} aria-hidden="true" /> {p.label}
              </Badge>
            )}
          </div>
          <h3 className={cn("mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50", done && "text-zinc-500 line-through dark:text-zinc-500")}>
            {assignment.title}
          </h3>
          {!compact && assignment.description && (
            <p className="mt-1 line-clamp-2 text-[13px] text-zinc-500 dark:text-zinc-400">{assignment.description}</p>
          )}
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 text-xs",
              status === "overdue" ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <Calendar size={13} aria-hidden="true" />
            {formatDateTime(assignment.deadline)}
            {!done && <span className="text-zinc-400 dark:text-zinc-500">· {status === "overdue" ? "was due " : "due "}{relativeTime(assignment.deadline, now)}</span>}
          </p>
        </div>

        {(onEdit || onDelete) && (
          <Dropdown
            trigger={({ toggle, open }) => (
              <button
                onClick={toggle}
                aria-label="Assignment actions"
                aria-expanded={open}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
              >
                <MoreHorizontal size={18} />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <DropdownItem
                  icon={done ? RotateCcw : CheckCircle2}
                  onClick={() => {
                    close();
                    onToggle?.(assignment);
                  }}
                >
                  {done ? "Mark as pending" : "Mark completed"}
                </DropdownItem>
                <DropdownItem
                  icon={Pencil}
                  onClick={() => {
                    close();
                    onEdit?.(assignment);
                  }}
                >
                  Edit
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  icon={Trash2}
                  danger
                  onClick={() => {
                    close();
                    onDelete?.(assignment);
                  }}
                >
                  Delete
                </DropdownItem>
              </>
            )}
          </Dropdown>
        )}
      </div>
    </Card>
  );
}
