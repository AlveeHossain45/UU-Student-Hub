import { cn } from "../../utils/cn";
import Card from "./Card";

export function Skeleton({ className }) {
  return <div className={cn("animate-shimmer rounded-lg bg-zinc-200/80 dark:bg-ink-700", className)} aria-hidden="true" />;
}

export function StatSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </Card>
  );
}

export function CardSkeleton({ lines = 3, className }) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </Card>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ variant = "list", ...props }) {
  if (variant === "grid") return <GridSkeleton {...props} />;
  if (variant === "card") return <CardSkeleton {...props} />;
  if (variant === "stat") return <StatSkeleton {...props} />;
  return <ListSkeleton {...props} />;
}
