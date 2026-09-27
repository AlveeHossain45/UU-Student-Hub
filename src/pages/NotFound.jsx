import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonClasses } from "../components/ui/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-ink-800 dark:text-zinc-400">
        <Compass size={26} />
      </span>
      <p className="mt-6 text-sm font-semibold text-brand-600 dark:text-brand-400">404</p>
      <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className={buttonClasses({ className: "mt-6" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
