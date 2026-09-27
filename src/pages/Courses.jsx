import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, BookOpen, User2, Award, Pencil, Trash2, ClipboardList, FileClock, Clock, Layers } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Badge, { STATUS_META } from "../components/ui/Badge";
import CourseCard from "../components/CourseCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { GridSkeleton } from "../components/ui/LoadingSkeleton";
import CourseFormModal from "../components/forms/CourseFormModal";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { cn } from "../utils/cn";
import { DAYS_SHORT, combineDateTime, formatDate, formatDateTime, formatTime12, getAssignmentStatus, getColor } from "../utils/helpers";

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <Icon size={14} /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function Courses() {
  useDocumentTitle("Courses");
  const { courses, assignments, exams, routine, loading, error, reload } = useData();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(location.state?.openId || null);
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    if (location.state?.openId) {
      setSelectedId(location.state.openId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const selected = courses.items.find((c) => c.id === selectedId) || null;
  const now = new Date();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.items.filter((c) => !q || [c.code, c.name, c.instructor].some((f) => f.toLowerCase().includes(q)));
  }, [courses.items, search]);

  const totalCredits = courses.items.reduce((s, c) => s + Number(c.credits || 0), 0);
  const avgProgress = courses.items.length ? Math.round(courses.items.reduce((s, c) => s + Number(c.progress || 0), 0) / courses.items.length) : 0;

  const pendingFor = (code) => assignments.items.filter((a) => a.course === code && getAssignmentStatus(a, now) !== "completed").length;

  const details = selected && {
    assignments: assignments.items
      .filter((a) => a.course === selected.code && getAssignmentStatus(a, now) !== "completed")
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
    exams: exams.items
      .filter((e) => e.course === selected.code && combineDateTime(e.date, e.time) > now)
      .sort((a, b) => combineDateTime(a.date, a.time) - combineDateTime(b.date, b.time)),
    schedule: routine.items.filter((r) => r.courseCode === selected.code).sort((a, b) => a.day - b.day),
  };

  const save = (data) => {
    const duplicate = courses.items.some((c) => c.code === data.code && c.id !== form.initial?.id);
    if (duplicate) {
      toast.error("A course with this code already exists.");
      return;
    }
    if (form.initial) {
      courses.update(form.initial.id, data);
      toast.success("Course updated.");
    } else {
      courses.add(data);
      toast.success("Course added successfully.");
    }
    setForm({ open: false, initial: null });
  };

  if (error) return <ErrorState description={error} onRetry={reload} />;

  const col = selected ? getColor(selected.color) : null;

  return (
    <div>
      <PageHeader
        title="My Courses"
        description="Everything about the courses you're taking this semester."
        actions={
          <Button icon={Plus} onClick={() => setForm({ open: true, initial: null })}>
            Add course
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Layers, label: "Enrolled courses", value: courses.items.length },
          { icon: Award, label: "Total credits", value: totalCredits },
          { icon: BookOpen, label: "Average progress", value: `${avgProgress}%` },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-ink-800 dark:text-zinc-300">
              <s.icon size={18} />
            </span>
            <div>
              <p className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Input icon={Search} placeholder="Search by code, name or instructor…" aria-label="Search courses" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-5 max-w-md" />

      {loading ? (
        <GridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "No courses match your search" : "No courses yet"}
          description={search ? "Try a different keyword." : "Add the courses you're enrolled in this semester."}
          action={!search && <Button icon={Plus} onClick={() => setForm({ open: true, initial: null })}>Add course</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} pendingCount={pendingFor(c.code)} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
      )}

      {/* Course details */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} size="lg" title={selected ? `${selected.code} · ${selected.name}` : ""} description={selected?.instructor}>
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center dark:border-ink-700">
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", col.bg, col.text)}>
                <BookOpen size={24} />
              </span>
              <div className="grid flex-1 grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Instructor</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium text-zinc-900 dark:text-zinc-100">
                    <User2 size={13} className="hidden sm:block" /> {selected.instructor}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Credits</p>
                  <p className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{selected.credits}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Progress</p>
                  <p className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{selected.progress}%</p>
                </div>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-ink-700">
              <div className={cn("h-full rounded-full", col.bar)} style={{ width: `${selected.progress}%` }} />
            </div>

            <Section icon={BookOpen} title="Course description">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{selected.description || "No description provided."}</p>
            </Section>

            <Section icon={Clock} title="Weekly schedule">
              {details.schedule.length === 0 ? (
                <p className="text-sm text-zinc-500">Not in your routine yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {details.schedule.map((r) => (
                    <span key={r.id} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 dark:border-ink-600 dark:text-zinc-300">
                      <b className="font-semibold text-zinc-900 dark:text-zinc-100">{DAYS_SHORT[r.day]}</b> · {formatTime12(r.start)} · {r.room}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            <div className="grid gap-6 sm:grid-cols-2">
              <Section icon={ClipboardList} title={`Upcoming assignments (${details.assignments.length})`}>
                {details.assignments.length === 0 ? (
                  <p className="text-sm text-zinc-500">No pending assignments. 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {details.assignments.map((a) => {
                      const s = STATUS_META[getAssignmentStatus(a, now)];
                      return (
                        <li key={a.id} className="rounded-xl border border-zinc-200 p-3 dark:border-ink-700">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500">{formatDateTime(a.deadline)}</span>
                            <Badge tone={s.tone}>{s.label}</Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>
              <Section icon={FileClock} title={`Upcoming exams (${details.exams.length})`}>
                {details.exams.length === 0 ? (
                  <p className="text-sm text-zinc-500">No upcoming exams.</p>
                ) : (
                  <ul className="space-y-2">
                    {details.exams.map((e) => (
                      <li key={e.id} className="rounded-xl border border-zinc-200 p-3 dark:border-ink-700">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{e.type}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatDate(e.date)} · {formatTime12(e.time)} · {e.room}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end dark:border-ink-700">
              <Button variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10" onClick={() => setToDelete(selected)}>
                Delete course
              </Button>
              <Button
                variant="outline"
                icon={Pencil}
                onClick={() => {
                  setForm({ open: true, initial: selected });
                  setSelectedId(null);
                }}
              >
                Edit course
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <CourseFormModal open={form.open} initial={form.initial} onClose={() => setForm({ open: false, initial: null })} onSubmit={save} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete course?"
        description={toDelete ? `${toDelete.code} ${toDelete.name} will be removed. Related assignments and exams are kept.` : ""}
        onConfirm={() => {
          courses.remove(toDelete.id);
          setSelectedId(null);
          toast.success("Course deleted.");
        }}
      />
    </div>
  );
}
