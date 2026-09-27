import { useMemo, useState } from "react";
import { Plus, CalendarDays, Clock, LayoutGrid, List, BookOpen, CalendarPlus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ClassCard from "../components/ClassCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { GridSkeleton } from "../components/ui/LoadingSkeleton";
import ClassFormModal from "../components/forms/ClassFormModal";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useNow from "../hooks/useNow";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { cn } from "../utils/cn";
import { DAYS, DAYS_SHORT, timeToMinutes } from "../utils/helpers";

export default function Routine() {
  useDocumentTitle("Routine");
  const { routine, loading, error, reload } = useData();
  const toast = useToast();
  const now = useNow(30000);
  const today = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [view, setView] = useState("week");
  const [selectedDay, setSelectedDay] = useState(today);
  const [modal, setModal] = useState({ open: false, initial: null, day: today });
  const [toDelete, setToDelete] = useState(null);

  const byDay = useMemo(() => {
    const map = Array.from({ length: 7 }, () => []);
    routine.items.forEach((c) => map[Number(c.day)]?.push(c));
    map.forEach((list) => list.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    return map;
  }, [routine.items]);

  const totalMinutes = routine.items.reduce((s, c) => s + Math.max(0, timeToMinutes(c.end) - timeToMinutes(c.start)), 0);
  const uniqueCourses = new Set(routine.items.map((c) => c.courseCode)).size;

  const stateFor = (c, day) => {
    if (day !== today) return "upcoming";
    const s = timeToMinutes(c.start);
    const e = timeToMinutes(c.end);
    if (e <= nowMin) return "past";
    if (s <= nowMin) return "ongoing";
    const next = byDay[today].find((x) => timeToMinutes(x.start) > nowMin);
    return next?.id === c.id ? "next" : "upcoming";
  };

  const save = (data) => {
    if (modal.initial) {
      routine.update(modal.initial.id, data);
      toast.success("Class updated.");
    } else {
      routine.add(data);
      toast.success("Class added to routine.");
    }
    setModal({ open: false, initial: null, day: today });
  };

  const openAdd = (day) => setModal({ open: true, initial: null, day });
  const openEdit = (c) => setModal({ open: true, initial: c, day: c.day });

  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Class Routine"
        description="Your weekly timetable. Today is highlighted."
        actions={
          <>
            <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-ink-800" role="tablist" aria-label="View mode">
              {[
                { k: "week", icon: LayoutGrid, label: "Week" },
                { k: "day", icon: List, label: "Day" },
              ].map((v) => (
                <button
                  key={v.k}
                  role="tab"
                  aria-selected={view === v.k}
                  onClick={() => setView(v.k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    view === v.k ? "bg-white text-zinc-900 shadow-sm dark:bg-ink-600 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  <v.icon size={14} /> {v.label}
                </button>
              ))}
            </div>
            <Button icon={Plus} onClick={() => openAdd(view === "day" ? selectedDay : today)}>
              Add class
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, label: "Classes / week", value: routine.items.length },
          { icon: Clock, label: "Hours / week", value: (totalMinutes / 60).toFixed(1) },
          { icon: BookOpen, label: "Courses", value: uniqueCourses },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 sm:flex dark:bg-ink-800 dark:text-zinc-300">
              <s.icon size={18} />
            </span>
            <div>
              <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <GridSkeleton count={6} />
      ) : routine.items.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="Your routine is empty"
          description="Add your weekly classes to get reminders and a live countdown on your dashboard."
          action={
            <Button icon={Plus} onClick={() => openAdd(today)}>
              Add your first class
            </Button>
          }
        />
      ) : view === "week" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {DAYS.map((day, i) => ({ day, i }))
            .sort((a, b) => ((a.i - today + 7) % 7) - ((b.i - today + 7) % 7))
            .map(({ day, i }) => {
              const isToday = i === today;
              return (
                <Card key={day} className={cn("flex flex-col p-4", isToday && "ring-2 ring-brand-500/60 dark:ring-brand-400/50")}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{day}</h2>
                      {isToday && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-brand-500">Today</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-400">{byDay[i].length} classes</span>
                      <button
                        onClick={() => openAdd(i)}
                        aria-label={`Add class on ${day}`}
                        className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {byDay[i].length === 0 ? (
                      <div className="flex h-full min-h-[80px] items-center justify-center rounded-xl border border-dashed border-zinc-200 text-xs text-zinc-400 dark:border-ink-600">
                        No classes · Free day
                      </div>
                    ) : (
                      byDay[i].map((c) => <ClassCard key={c.id} cls={c} state={stateFor(c, i)} onEdit={openEdit} onDelete={setToDelete} />)
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        <div>
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0" role="tablist" aria-label="Select day">
            {DAYS_SHORT.map((d, i) => (
              <button
                key={d}
                role="tab"
                aria-selected={selectedDay === i}
                onClick={() => setSelectedDay(i)}
                className={cn(
                  "flex min-w-[64px] flex-col items-center rounded-2xl border px-3 py-2.5 transition",
                  selectedDay === i
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-ink-700 dark:bg-ink-900 dark:text-zinc-300"
                )}
              >
                <span className="text-xs font-semibold">{d}</span>
                <span className="mt-0.5 text-[10px] opacity-60">{byDay[i].length} cls</span>
                {i === today && <span className={cn("mt-1 h-1 w-1 rounded-full", selectedDay === i ? "bg-brand-400" : "bg-brand-500")} />}
              </button>
            ))}
          </div>
          <Card className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                {DAYS[selectedDay]} {selectedDay === today && <span className="ml-1 text-xs font-medium text-brand-600 dark:text-brand-400">· Today</span>}
              </h2>
              <Button size="sm" variant="subtle" icon={Plus} onClick={() => openAdd(selectedDay)}>
                Add
              </Button>
            </div>
            {byDay[selectedDay].length === 0 ? (
              <EmptyState compact icon={CalendarDays} title="No classes on this day" description="Enjoy your free time or add a class." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {byDay[selectedDay].map((c) => (
                  <ClassCard key={c.id} cls={c} state={stateFor(c, selectedDay)} onEdit={openEdit} onDelete={setToDelete} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <ClassFormModal
        open={modal.open}
        initial={modal.initial}
        defaultDay={modal.day}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSubmit={save}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete class?"
        description={toDelete ? `${toDelete.courseCode} on ${DAYS[toDelete.day]} will be removed from your routine.` : ""}
        onConfirm={() => {
          routine.remove(toDelete.id);
          toast.success("Class removed.");
        }}
      />
    </div>
  );
}
