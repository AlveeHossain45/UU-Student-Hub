import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { resolveRuntimeMode } from "./services/api";

/** Shown while we check whether the backend is reachable. */
function Boot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveRuntimeMode().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-ink-950">
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl text-white shadow-lg shadow-brand-600/30">
            🎓
          </span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-ink-800">
            <span className="block h-full w-1/3 animate-shimmer rounded-full bg-brand-500" />
          </span>
        </div>
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Boot />
  </StrictMode>
);
