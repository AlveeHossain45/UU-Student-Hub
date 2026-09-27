import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ title = "Something went wrong", description = "We couldn't load this section.", onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-12 text-center dark:border-red-500/20 dark:bg-red-500/5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RotateCcw} className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
