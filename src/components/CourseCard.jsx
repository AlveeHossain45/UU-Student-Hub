import { BookOpen, User2, ArrowUpRight } from "lucide-react";
import Card from "./ui/Card";
import { cn } from "../utils/cn";
import { getColor } from "../utils/helpers";

export default function CourseCard({ course, onClick, pendingCount = 0 }) {
  const c = getColor(course.color);
  return (
    <Card
      as="button"
      hover
      onClick={onClick}
      className="group flex w-full flex-col p-5 text-left focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`Open ${course.code} ${course.name}`}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.bg, c.text)}>
          <BookOpen size={20} aria-hidden="true" />
        </span>
        <ArrowUpRight
          size={18}
          className="text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-300"
          aria-hidden="true"
        />
      </div>
      <p className={cn("mt-4 text-xs font-semibold tracking-wide", c.text)}>{course.code}</p>
      <h3 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-white">{course.name}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <User2 size={13} aria-hidden="true" /> {course.instructor}
        </span>
        <span aria-hidden="true">·</span>
        <span>{course.credits} Credits</span>
      </div>
      <div className="mt-5 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Progress</span>
          <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{course.progress}%</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-ink-700"
          role="progressbar"
          aria-valuenow={course.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${course.name} progress`}
        >
          <div className={cn("h-full rounded-full transition-all duration-700", c.bar)} style={{ width: `${course.progress}%` }} />
        </div>
      </div>
      {pendingCount > 0 && (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{pendingCount}</span> pending assignment{pendingCount > 1 ? "s" : ""}
        </p>
      )}
    </Card>
  );
}
