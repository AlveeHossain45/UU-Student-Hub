import { Outlet } from "react-router-dom";
import { CalendarCheck2, Calculator, Sparkles, BellRing } from "lucide-react";
import Logo from "../components/Logo";
import ThemeToggle from "../components/layout/ThemeToggle";

const FEATURES = [
  { icon: CalendarCheck2, title: "Smart routine", text: "Live countdown to your next class." },
  { icon: Calculator, title: "CGPA planner", text: "Know exactly what GPA you need." },
  { icon: Sparkles, title: "AI study buddy", text: "Explanations, MCQs & study plans." },
  { icon: BellRing, title: "Never miss a deadline", text: "Assignments, exams & notices." },
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" aria-hidden="true" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative mt-auto max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Built for Uttara University students
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Your entire semester,
            <br />
            <span className="text-brand-300">beautifully organized.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Classes, assignments, exams, notices and your CGPA — all in one calm, focused workspace.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                <f.icon size={18} className="text-brand-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold">{f.title}</p>
                <p className="mt-0.5 text-xs text-white/50">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative mt-10 text-xs text-white/40">© {new Date().getFullYear()} UU Student Hub · Uttara University, Dhaka</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col bg-white dark:bg-ink-950">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-[420px] animate-slide-up">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
