import { useMemo, useState } from "react";
import { Plus, Trash2, Calculator, Target, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Info, Download } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Card, { CardHeader, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input, { fieldClasses } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useLocalStorage from "../hooks/useLocalStorage";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { initialCgpaCourses } from "../data/mockData";
import { cn } from "../utils/cn";
import { GRADE_SCALE, gradePoint, uid } from "../utils/helpers";

function Gauge({ value, max = 4, label, sub }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = value >= 3.5 ? "text-emerald-500" : value >= 3 ? "text-brand-500" : value >= 2.5 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} strokeWidth="10" className="fill-none stroke-zinc-100 dark:stroke-ink-700" />
          <circle
            cx="60"
            cy="60"
            r={r}
            strokeWidth="10"
            strokeLinecap="round"
            className={cn("fill-none stroke-current transition-all duration-700", color)}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">{value.toFixed(2)}</span>
          <span className="text-[11px] text-zinc-400">out of {max.toFixed(2)}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
      {sub && <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
    </div>
  );
}

const standing = (g) =>
  g >= 3.75 ? "Outstanding · Dean's List territory" : g >= 3.5 ? "Excellent standing" : g >= 3 ? "Good standing" : g >= 2.5 ? "Satisfactory" : g > 0 ? "Needs improvement" : "Add courses to calculate";

export default function CGPA() {
  useDocumentTitle("CGPA Calculator");
  const { user } = useAuth();
  const { courses: enrolled } = useData();
  const toast = useToast();

  const [rows, setRows] = useLocalStorage("uu_cgpa_courses", initialCgpaCourses);
  const [prev, setPrev] = useLocalStorage("uu_cgpa_prev", { cgpa: String(user?.cgpa ?? "3.42"), credits: String(user?.creditsCompleted ?? "96") });
  const [target, setTarget] = useState({
    current: String(user?.cgpa ?? "3.42"),
    completed: String(user?.creditsCompleted ?? "96"),
    remaining: "64",
    target: "3.60",
  });

  const updateRow = (id, patch) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addRow = () => setRows((r) => [...r, { id: uid(), code: "", name: "", credit: 3, grade: "A" }]);
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const importEnrolled = () => {
    const existing = new Set(rows.map((r) => r.code));
    const add = enrolled.items.filter((c) => !existing.has(c.code)).map((c) => ({ id: uid(), code: c.code, name: c.name, credit: Number(c.credits), grade: "A" }));
    if (!add.length) return toast.info("All enrolled courses are already added.");
    setRows((r) => [...r, ...add]);
    toast.success(`${add.length} course${add.length > 1 ? "s" : ""} imported.`);
  };

  const result = useMemo(() => {
    const valid = rows.filter((r) => Number(r.credit) > 0);
    const semCredits = valid.reduce((s, r) => s + Number(r.credit), 0);
    const semPoints = valid.reduce((s, r) => s + Number(r.credit) * gradePoint(r.grade), 0);
    const semGpa = semCredits ? semPoints / semCredits : 0;
    const pc = Math.max(0, Number(prev.credits) || 0);
    const pg = Math.min(4, Math.max(0, Number(prev.cgpa) || 0));
    const totalCredits = pc + semCredits;
    const overall = totalCredits ? (pg * pc + semPoints) / totalCredits : 0;
    return { semGpa, semCredits, overall, totalCredits };
  }, [rows, prev]);

  const targetResult = useMemo(() => {
    const cur = Number(target.current);
    const done = Number(target.completed);
    const rem = Number(target.remaining);
    const tgt = Number(target.target);
    if ([cur, done, rem, tgt].some((v) => isNaN(v)) || target.remaining === "" || target.target === "") return { state: "idle" };
    if (cur < 0 || cur > 4 || tgt < 0 || tgt > 4) return { state: "invalid", msg: "CGPA values must be between 0.00 and 4.00." };
    if (rem <= 0) return { state: "invalid", msg: "Remaining credits must be greater than 0." };
    if (done < 0) return { state: "invalid", msg: "Completed credits cannot be negative." };
    const required = (tgt * (done + rem) - cur * done) / rem;
    const maxPossible = (cur * done + 4 * rem) / (done + rem);
    if (required > 4) return { state: "impossible", required, maxPossible };
    if (required <= 0) return { state: "secured", required: 0 };
    return { state: required >= 3.75 ? "hard" : required >= 3.25 ? "moderate" : "easy", required };
  }, [target]);

  const setT = (k) => (e) => setTarget((t) => ({ ...t, [k]: e.target.value }));

  const feedback = {
    easy: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300", title: "Very achievable!", text: "Keep up consistent work and you'll hit your target comfortably." },
    moderate: { icon: Info, cls: "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300", title: "Achievable with focus", text: "You'll need mostly A- and above grades. Plan your semesters wisely." },
    hard: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300", title: "Challenging but possible", text: "You'll need near-perfect grades (A / A+) in most remaining courses." },
    secured: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300", title: "Target already secured 🎉", text: "Even with minimum passing grades you'll stay above your target." },
    impossible: { icon: XCircle, cls: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300", title: "Target is mathematically impossible", text: "" },
    invalid: { icon: AlertTriangle, cls: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300", title: "Check your inputs", text: "" },
  };
  const fb = feedback[targetResult.state];

  return (
    <div>
      <PageHeader title="Smart CGPA Calculator" description="Calculate semester GPA, overall CGPA and plan the grades you need." />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Semester calculator */}
          <Card>
            <CardHeader
              title="Semester courses"
              description="Add courses with credits and expected grades"
              icon={Calculator}
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" icon={Download} onClick={importEnrolled} className="hidden sm:inline-flex">
                    Import enrolled
                  </Button>
                  <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => { setRows([]); toast.info("Calculator cleared."); }} aria-label="Clear all courses">
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </div>
              }
            />
            <CardBody>
              {rows.length === 0 ? (
                <EmptyState compact icon={Calculator} title="No courses added" description="Add a course or import your enrolled courses." />
              ) : (
                <div>
                  <div className="hidden grid-cols-[110px_1fr_90px_110px_40px] gap-3 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 md:grid">
                    <span>Code</span>
                    <span>Course name</span>
                    <span>Credit</span>
                    <span>Grade</span>
                    <span className="sr-only">Remove</span>
                  </div>
                  <ul className="space-y-2.5">
                    {rows.map((r, i) => (
                      <li key={r.id} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 p-3 md:grid-cols-[110px_1fr_90px_110px_40px] md:items-center md:gap-3 md:border-0 md:p-0 dark:border-ink-700">
                        <input aria-label={`Course ${i + 1} code`} placeholder="CSE 221" value={r.code} onChange={(e) => updateRow(r.id, { code: e.target.value })} className={cn(fieldClasses, "h-10")} />
                        <input aria-label={`Course ${i + 1} name`} placeholder="Course name" value={r.name} onChange={(e) => updateRow(r.id, { name: e.target.value })} className={cn(fieldClasses, "h-10")} />
                        <select aria-label={`Course ${i + 1} credit`} value={r.credit} onChange={(e) => updateRow(r.id, { credit: Number(e.target.value) })} className={cn(fieldClasses, "h-10 cursor-pointer")}>
                          {[1, 1.5, 2, 3, 4].map((c) => (
                            <option key={c} value={c}>
                              {c} cr
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2 md:contents">
                          <select aria-label={`Course ${i + 1} grade`} value={r.grade} onChange={(e) => updateRow(r.id, { grade: e.target.value })} className={cn(fieldClasses, "h-10 flex-1 cursor-pointer font-semibold")}>
                            {GRADE_SCALE.map((g) => (
                              <option key={g.grade} value={g.grade}>
                                {g.grade} ({g.point.toFixed(2)})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeRow(r.id)}
                            aria-label={`Remove course ${r.code || i + 1}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="subtle" icon={Plus} onClick={addRow}>
                  Add course
                </Button>
                <Button variant="outline" icon={Download} onClick={importEnrolled} className="sm:hidden">
                  Import enrolled
                </Button>
              </div>

              <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2 dark:border-ink-700">
                <Input label="Previous CGPA" type="number" step="0.01" min="0" max="4" value={prev.cgpa} onChange={(e) => setPrev((p) => ({ ...p, cgpa: e.target.value }))} hint="Your CGPA before this semester" />
                <Input label="Previous credits completed" type="number" min="0" value={prev.credits} onChange={(e) => setPrev((p) => ({ ...p, credits: e.target.value }))} hint="Credits earned before this semester" />
              </div>
            </CardBody>
          </Card>

          {/* Target calculator */}
          <Card>
            <CardHeader title="Target CGPA Calculator" description="Find the average GPA you need in your remaining credits" icon={Target} />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="Current CGPA" type="number" step="0.01" min="0" max="4" value={target.current} onChange={setT("current")} />
                <Input label="Completed credits" type="number" min="0" value={target.completed} onChange={setT("completed")} />
                <Input label="Remaining credits" type="number" min="1" value={target.remaining} onChange={setT("remaining")} />
                <Input label="Target CGPA" type="number" step="0.01" min="0" max="4" value={target.target} onChange={setT("target")} />
              </div>

              {targetResult.state !== "idle" && fb && (
                <div className={cn("mt-5 flex animate-fade-in flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center", fb.cls)} role="status" aria-live="polite">
                  <fb.icon size={28} className="shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-semibold">{fb.title}</p>
                    <p className="mt-0.5 text-sm opacity-90">
                      {targetResult.state === "impossible"
                        ? `You would need an average of ${targetResult.required.toFixed(2)} GPA, but the maximum is 4.00. The highest CGPA you can reach is ${targetResult.maxPossible.toFixed(2)}.`
                        : targetResult.state === "invalid"
                          ? targetResult.msg
                          : fb.text}
                    </p>
                  </div>
                  {["easy", "moderate", "hard", "secured"].includes(targetResult.state) && (
                    <div className="shrink-0 rounded-xl bg-white/70 px-4 py-3 text-center dark:bg-black/20">
                      <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Required avg.</p>
                      <p className="text-3xl font-bold tabular-nums">{targetResult.required.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Results sidebar */}
        <div className="space-y-6">
          <Card className="p-6 xl:sticky xl:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Results</p>
            <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-1">
              <Gauge value={result.semGpa} label="Semester GPA" sub={`${result.semCredits} credits`} />
              <Gauge value={result.overall} label="Overall CGPA" sub={standing(result.overall)} />
            </div>
            <dl className="mt-6 space-y-2.5 border-t border-zinc-100 pt-5 text-sm dark:border-ink-700">
              {[
                ["Semester credits", result.semCredits],
                ["Previous credits", Number(prev.credits) || 0],
                ["Total credits", result.totalCredits],
                ["Courses this semester", rows.length],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">{k}</dt>
                  <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="UU Grading Scale" description="UGC uniform grading system" />
            <CardBody>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="pb-2 font-semibold">Marks</th>
                    <th className="pb-2 font-semibold">Grade</th>
                    <th className="pb-2 text-right font-semibold">Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-ink-700">
                  {GRADE_SCALE.map((g) => (
                    <tr key={g.grade}>
                      <td className="py-1.5 tabular-nums text-zinc-500 dark:text-zinc-400">{g.range}</td>
                      <td className="py-1.5 font-semibold text-zinc-900 dark:text-zinc-100">{g.grade}</td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{g.point.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
