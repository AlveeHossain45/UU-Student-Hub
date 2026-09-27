import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Booting() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-ink-950">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-600 dark:border-ink-700 dark:border-t-brand-400" />
    </div>
  );
}

/** Only allow authenticated users. */
export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // Wait for the session check before deciding — avoids bouncing to /login
  // while the API-backed provider is still loading the current user.
  if (initializing) return <Booting />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Redirect logged-in users away from login/register. */
export function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <Booting />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
