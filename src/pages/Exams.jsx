import { useMemo, useState } from "react";
import { Plus, FileClock, MapPin, Clock, CalendarDays, Pencil, Trash2, History, PartyPopper, BookText } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ListSkeleton, Skeleton } from "../components/ui/LoadingSkeleton";
import ExamFormModal from "../components/forms/ExamFormModal";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useNow from "../hooks/useNow";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { cn } from "../utils/cn";
import { combineDateTime, formatDate, formatTime12, humanCountdown, pad, splitDuration } from "../utils/helpers";

const TYPE_TONE = { Final: "red", Midterm: "amber", Quiz: "blue", "Lab Exam": "purple", Viva: "cyan", Presentation: "green" };

function Countdown({ ms }) {
  const d = splitDuration(ms);
  const units = [
    { v: d.days, l: "Days" },
    { v: d.hours, l: "Hours" },
    { v: d.minutes, l: "Minutes" },
    { v: d.seconds, l: "Seconds" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Time until exam">
      {units.map((u) => (
        <div key={u.l} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center sm:p-4">
          <p className="text-2xl font-bold tabular-nums sm:text-4xl">{pad(u.v)}</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/50 sm:text-xs">{u.l}</p>
        </div>
      ))}
    </div>
  );
}

function ExamRow({ exam, now, onEdit, onDelete, past }) {
  const at = combineDateTime(exam.date, exam.time);
  const ms = at - now;
  const days = Math.ceil(ms / 86400000);
  return (
    <Card hover className={cn("group p-4", past && "opacity-70")}>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-ink-600 dark:bg-ink-800">
          <span className="text-[10px] font-semibold uppercase text-red-500">{at.toLocaleDateString("en-US", { month: "short" })}</span>
          <span className="text-lg font-bold leading-none text-zinc-900 dark:text-white">{at.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-brand-600 dark:text-brand-400">{exam.course}</span>
            <Badge tone={TYPE_TONE[exam.type] || "gray"}>{exam.type}</Badge>
          </div>
          <h3 className="mt-0.5 text-[15px] font-semibold text-zinc-900 dark:text-white">{exam.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} /> {formatDate(exam.date, { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {formatTime12(exam.time)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {exam.room}
            </span>
          </div>
          {exam.syllabus && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <BookText size={12} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{exam.syllabus}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {!past && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                days <= 3 ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-zinc-100 text-zinc-600 dark:bg-ink-700 dark:text-zinc-300"
              )}
            >
              {days <= 1 ? humanCountdown(ms) : `in ${days} days`}
            </span>
          )}
          <div className="flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button onClick={() => onEdit(exam)} aria-label={`Edit ${exam.title} exam`} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(exam)} aria-label={`Delete ${exam.title} exam`} className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Exams() {
  useDocumentTitle("Exams");
  const { exams, loading, error, reload } = useData();
  const toast = useToast();
  const now = useNow(1000);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const list = exams.items.map((e) => ({ ...e, _at: combineDateTime(e.date, e.time) }));
    return {
      upcoming: list.filter((e) => e._at > now).sort((a, b) => a._at - b._at),
      past: list.filter((e) => e._at <= now).sort((a, b) => b._at - a._at),
    };
  }, [exams.items, now]);

  const next = upcoming[0];

  const save = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { _at, ...clean } = data;
    if (modal.initial) {
      exams.update(modal.initial.id, clean);
      toast.success("Exam updated.");
    } else {
      exams.add(clean);
      toast.success("Exam added successfully.");
    }
    setModal({ open: false, initial: null });
  };

  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Exams"
        description="Countdowns to every quiz, midterm and final."
        actions={
          <Button icon={Plus} onClick={() => setModal({ open: true, initial: null })}>
            Add exam
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="mb-6 h-56 w-full rounded-2xl" />
      ) : next ? (
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white sm:p-8 dark:border-ink-600 dark:bg-ink-800">
          <div className="bg-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]" aria-hidden="true" />
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-red-500/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                <FileClock size={12} /> Next exam
              </span>
              <p className="mt-4 text-sm font-semibold text-brand-300">
                {next.course} · {next.type}
              </p>
              <h2 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{next.title}</h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> {formatDate(next.date, { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} /> {formatTime12(next.time)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {next.room}
                </span>
              </div>
            </div>
            <Countdown ms={next._at - now} />
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Upcoming Exams <span className="ml-1 text-zinc-400">({upcoming.length})</span>
        </h2>
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No upcoming exams."
          description="Add your exam schedule to get countdowns and reminders."
          action={
            <Button icon={Plus} onClick={() => setModal({ open: true, initial: null })}>
              Add exam
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {upcoming.map((e) => (
            <ExamRow key={e.id} exam={e} now={now} onEdit={(x) => setModal({ open: true, initial: x })} onDelete={setToDelete} />
          ))}
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <History size={15} /> Past exams ({past.length}) <span className="text-xs font-normal">{showPast ? "Hide" : "Show"}</span>
          </button>
          {showPast && (
            <div className="grid animate-fade-in gap-3 lg:grid-cols-2">
              {past.map((e) => (
                <ExamRow key={e.id} exam={e} now={now} past onEdit={(x) => setModal({ open: true, initial: x })} onDelete={setToDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      <ExamFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false, initial: null })} onSubmit={save} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete exam?"
        description={toDelete ? `${toDelete.title} ${toDelete.type} will be removed.` : ""}
        onConfirm={() => {
          exams.remove(toDelete.id);
          toast.success("Exam deleted.");
        }}
      />
    </div>
  );
}
