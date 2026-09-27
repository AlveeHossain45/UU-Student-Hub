import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookCheck,
  ClipboardList,
  UserCheck,
  CalendarDays,
  Plus,
  Sparkles,
  ArrowRight,
  FileClock,
  Megaphone,
  TrendingUp,
  PartyPopper,
  MapPin,
} from "lucide-react";
import Card, { CardHeader, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import StatCard from "../components/StatCard";
import AssignmentCard from "../components/AssignmentCard";
import NoticeCard from "../components/NoticeCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { StatSkeleton, CardSkeleton, Skeleton } from "../components/ui/LoadingSkeleton";
import NextClassCard from "../components/dashboard/NextClassCard";
import TodayTimeline from "../components/dashboard/TodayTimeline";
import GpaTrendChart from "../components/dashboard/GpaTrendChart";
import AssignmentFormModal from "../components/forms/AssignmentFormModal";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useNow from "../hooks/useNow";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { GPA_HISTORY } from "../data/mockData";
import { cn } from "../utils/cn";
import { combineDateTime, formatTime12, getAssignmentStatus, getFirstName, getGreeting, humanCountdown } from "../utils/helpers";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { loading, error, reload, routine, assignments, exams, notices, markNoticeRead } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const now = useNow(60000);
  const [tab, setTab] = useState("upcoming");
  const [addOpen, setAddOpen] = useState(false);

  const withStatus = useMemo(
    () => assignments.items.map((a) => ({ ...a, _status: getAssignmentStatus(a, now) })),
    [assignments.items, now]
  );
  const buckets = useMemo(
    () => ({
      upcoming: withStatus.filter((a) => a._status === "pending" || a._status === "in-progress").sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
      completed: withStatus.filter((a) => a._status === "completed"),
      overdue: withStatus.filter((a) => a._status === "overdue"),
    }),
    [withStatus]
  );

  const upcomingExams = useMemo(
    () =>
      exams.items
        .map((e) => ({ ...e, at: combineDateTime(e.date, e.time) }))
        .filter((e) => e.at > now)
        .sort((a, b) => a.at - b.at)
        .slice(0, 3),
    [exams.items, now]
  );

  const recentNotices = [...notices.items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const todayCount = routine.items.filter((c) => Number(c.day) === now.getDay()).length;
  const history = [...GPA_HISTORY, { label: "Now", gpa: Number(user?.cgpa) || 0 }].filter((d) => d.gpa > 0);

  const toggle = (a) => {
    const done = getAssignmentStatus(a) === "completed";
    assignments.update(a.id, { status: done ? "pending" : "completed" });
    toast.success(done ? "Assignment marked as pending." : "Assignment completed. 🎉");
  };

  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            {getGreeting(now)}, {getFirstName(user?.name)} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Here's what's happening with your studies today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Sparkles} onClick={() => navigate("/assistant")}>
            Ask AI
          </Button>
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            New assignment
          </Button>
        </div>
      </div>

      {/* Today's overview */}
      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="sr-only">
          Today's Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="CGPA" value={Number(user?.cgpa || 0).toFixed(2)} suffix="/4.00" icon={GraduationCap} tone="blue" progress={(Number(user?.cgpa || 0) / 4) * 100} />
              <StatCard label="Credits Completed" value={user?.creditsCompleted ?? 0} icon={BookCheck} tone="green" hint="of 160 credits" progress={Math.min(100, ((user?.creditsCompleted || 0) / 160) * 100)} />
              <StatCard label="Pending Assignments" value={buckets.upcoming.length} icon={ClipboardList} tone="amber" hint={buckets.overdue.length ? `${buckets.overdue.length} overdue` : "All on track"} />
              <StatCard label="Attendance" value={user?.attendance ?? 0} suffix="%" icon={UserCheck} tone="violet" progress={user?.attendance ?? 0} hint={(user?.attendance ?? 0) >= 75 ? "Above 75% requirement" : "Below requirement"} />
            </>
          )}
        </div>
      </section>

      {/* Next class + exams */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{loading ? <Skeleton className="h-[260px] w-full rounded-2xl" /> : <NextClassCard routine={routine.items} />}</div>

        <Card className="flex flex-col">
          <CardHeader
            title="Upcoming Exams"
            description="Stay prepared"
            icon={FileClock}
            action={
              <Link to="/exams" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all
              </Link>
            }
          />
          <CardBody className="flex-1 space-y-2.5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : upcomingExams.length === 0 ? (
              <EmptyState compact icon={PartyPopper} title="No upcoming exams" description="Enjoy the breathing room!" />
            ) : (
              upcomingExams.map((e, i) => {
                const days = Math.ceil((e.at - now) / 86400000);
                return (
                  <Link
                    key={e.id}
                    to="/exams"
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition hover:border-zinc-300 dark:hover:border-ink-500",
                      i === 0 ? "border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5" : "border-zinc-200/80 dark:border-ink-700"
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center shadow-xs ring-1 ring-zinc-200 dark:bg-ink-800 dark:ring-ink-600">
                      <span className="text-[10px] font-semibold uppercase text-red-500">{e.at.toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-base font-bold leading-none text-zinc-900 dark:text-white">{e.at.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {e.type} · {formatTime12(e.time)} · <MapPin size={11} /> {e.room}
                      </p>
                    </div>
                    <Badge tone={days <= 3 ? "red" : "gray"}>{days <= 1 ? humanCountdown(e.at - now) : `${days}d`}</Badge>
                  </Link>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Timeline + assignments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Today's Classes"
            description={`${todayCount} class${todayCount === 1 ? "" : "es"} scheduled`}
            icon={CalendarDays}
            action={
              <Link to="/routine" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Full routine
              </Link>
            }
          />
          <CardBody>{loading ? <CardSkeleton lines={4} className="border-0 p-0 shadow-none" /> : <TodayTimeline routine={routine.items} />}</CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Assignment Tracker"
            description="Tick them off as you go"
            icon={ClipboardList}
            action={
              <Button size="sm" variant="subtle" icon={Plus} onClick={() => setAddOpen(true)}>
                Add
              </Button>
            }
          />
          <CardBody>
            <div className="mb-4 inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-ink-800" role="tablist" aria-label="Assignment filter">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    tab === t.key ? "bg-white text-zinc-900 shadow-sm dark:bg-ink-600 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {t.label}
                  <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", t.key === "overdue" && buckets.overdue.length ? "bg-red-500 text-white" : "bg-zinc-200/80 dark:bg-ink-700")}>
                    {buckets[t.key].length}
                  </span>
                </button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : buckets[tab].length === 0 ? (
              <EmptyState
                compact
                icon={ClipboardList}
                title="No assignments found."
                description={tab === "overdue" ? "Nothing overdue — great job staying on top of things!" : "Add an assignment to start tracking."}
              />
            ) : (
              <div className="space-y-2.5">
                {buckets[tab].slice(0, 4).map((a) => (
                  <AssignmentCard key={a.id} assignment={a} now={now} compact onToggle={toggle} />
                ))}
                {buckets[tab].length > 4 && (
                  <Link to="/assignments" className="flex items-center justify-center gap-1 pt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    View {buckets[tab].length - 4} more <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* GPA trend + notices */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Academic Performance"
            description="GPA trend across semesters"
            icon={TrendingUp}
            action={
              <Link to="/cgpa" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                CGPA calculator
              </Link>
            }
          />
          <CardBody className="pt-4">{loading ? <Skeleton className="h-52" /> : <GpaTrendChart data={history} />}</CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Latest Notices"
            description={`${notices.items.filter((n) => !n.read).length} unread`}
            icon={Megaphone}
            action={
              <Link to="/notices" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all
              </Link>
            }
          />
          <CardBody className="-mx-2 space-y-0.5 px-3">
            {loading ? (
              <div className="space-y-3 px-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : recentNotices.length === 0 ? (
              <EmptyState compact icon={Megaphone} title="No notices available." />
            ) : (
              recentNotices.map((n) => (
                <NoticeCard
                  key={n.id}
                  notice={n}
                  compact
                  onClick={() => {
                    markNoticeRead(n.id);
                    navigate("/notices", { state: { openId: n.id } });
                  }}
                />
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <AssignmentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => {
          assignments.add(data);
          setAddOpen(false);
          toast.success("Assignment added successfully.");
        }}
      />
    </div>
  );
}
