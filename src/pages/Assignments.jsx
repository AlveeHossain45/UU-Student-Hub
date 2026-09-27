import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, ClipboardList, Clock, CheckCircle2, AlertTriangle, Loader, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import StatCard from "../components/StatCard";
import AssignmentCard from "../components/AssignmentCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ListSkeleton } from "../components/ui/LoadingSkeleton";
import AssignmentFormModal from "../components/forms/AssignmentFormModal";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useNow from "../hooks/useNow";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { cn } from "../utils/cn";
import { getAssignmentStatus } from "../utils/helpers";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

export default function Assignments() {
  useDocumentTitle("Assignments");
  const { assignments, courses, loading, error, reload } = useData();
  const toast = useToast();
  const now = useNow(60000);
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState(location.state?.search || "");
  const [course, setCourse] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("deadline");
  const [modal, setModal] = useState({ open: !!location.state?.openNew, initial: null });
  const [toDelete, setToDelete] = useState(null);

  // Handle navigation intents (from global search / quick actions)
  useEffect(() => {
    if (!location.state) return;
    if (location.state.search) {
      setSearch(location.state.search);
      setTab("all");
    }
    if (location.state.openNew) setModal({ open: true, initial: null });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => assignments.items.map((a) => ({ ...a, _status: getAssignmentStatus(a, now) })), [assignments.items, now]);

  const counts = {
    all: items.length,
    upcoming: items.filter((a) => a._status === "pending" || a._status === "in-progress").length,
    completed: items.filter((a) => a._status === "completed").length,
    overdue: items.filter((a) => a._status === "overdue").length,
    inProgress: items.filter((a) => a._status === "in-progress").length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pOrder = { high: 0, medium: 1, low: 2 };
    return items
      .filter((a) => {
        if (tab === "upcoming" && !(a._status === "pending" || a._status === "in-progress")) return false;
        if (tab === "completed" && a._status !== "completed") return false;
        if (tab === "overdue" && a._status !== "overdue") return false;
        if (course !== "all" && a.course !== course) return false;
        if (priority !== "all" && a.priority !== priority) return false;
        if (q && ![a.title, a.description, a.course].some((f) => f?.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "priority") return pOrder[a.priority] - pOrder[b.priority];
        if (sort === "title") return a.title.localeCompare(b.title);
        return new Date(a.deadline) - new Date(b.deadline);
      });
  }, [items, tab, search, course, priority, sort]);

  const toggle = (a) => {
    const done = getAssignmentStatus(a) === "completed";
    assignments.update(a.id, { status: done ? "pending" : "completed" });
    toast.success(done ? "Assignment marked as pending." : "Assignment completed.", done ? undefined : "Nice work! Keep the streak going 🎉");
  };

  const save = (data) => {
    if (modal.initial) {
      assignments.update(modal.initial.id, data);
      toast.success("Assignment updated.");
    } else {
      assignments.add(data);
      toast.success("Assignment added successfully.");
    }
    setModal({ open: false, initial: null });
  };

  const hasFilters = search || course !== "all" || priority !== "all";

  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Track every deadline across all your courses."
        actions={
          <Button icon={Plus} onClick={() => setModal({ open: true, initial: null })}>
            Add assignment
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Upcoming" value={counts.upcoming} icon={Clock} tone="blue" />
        <StatCard label="In Progress" value={counts.inProgress} icon={Loader} tone="violet" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="Overdue" value={counts.overdue} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-ink-800" role="tablist" aria-label="Filter by status">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  tab === t.key ? "bg-white text-zinc-900 shadow-sm dark:bg-ink-600 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {t.label}
                <span className="rounded-full bg-zinc-200/80 px-1.5 text-[10px] tabular-nums dark:bg-ink-700">{counts[t.key]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Input
            icon={Search}
            placeholder="Search assignments…"
            aria-label="Search assignments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="col-span-2 sm:w-60"
          />
          <Select
            aria-label="Filter by course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            options={[{ value: "all", label: "All courses" }, ...courses.items.map((c) => ({ value: c.code, label: c.code }))]}
            className="sm:w-36"
          />
          <Select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: "all", label: "Any priority" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
            className="sm:w-36"
          />
          <Select
            aria-label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { value: "deadline", label: "Sort: Deadline" },
              { value: "priority", label: "Sort: Priority" },
              { value: "title", label: "Sort: Title" },
            ]}
            className="col-span-2 sm:w-40"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setSearch("");
            setCourse("all");
            setPriority("all");
          }}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <X size={13} /> Clear filters
        </button>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found."
          description={hasFilters ? "Try adjusting your search or filters." : "Create your first assignment to start tracking deadlines."}
          action={
            !hasFilters && (
              <Button icon={Plus} onClick={() => setModal({ open: true, initial: null })}>
                Add assignment
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              now={now}
              onToggle={toggle}
              onEdit={(x) => setModal({ open: true, initial: x })}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      <AssignmentFormModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false, initial: null })} onSubmit={save} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete assignment?"
        description={toDelete ? `"${toDelete.title}" will be permanently deleted.` : ""}
        onConfirm={() => {
          assignments.remove(toDelete.id);
          toast.success("Assignment deleted.");
        }}
      />
    </div>
  );
}
