import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SearchModal from "../components/layout/SearchModal";
import ErrorBoundary from "../components/ErrorBoundary";
import useLocalStorage from "../hooks/useLocalStorage";
import useClassReminders from "../hooks/useClassReminders";
import { cn } from "../utils/cn";

export default function DashboardLayout() {
  useClassReminders();
  const [collapsed, setCollapsed] = useLocalStorage("uu_sidebar_collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const isAssistant = location.pathname.startsWith("/assistant");

  return (
    <div className="min-h-screen">
      {/* Ambient page backdrop: a soft brand wash behind the content */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-zinc-50 dark:bg-ink-950" aria-hidden="true">
        <div className="absolute -top-48 -left-40 h-[460px] w-[680px] rounded-full bg-brand-500/[0.10] blur-3xl dark:bg-brand-600/[0.12]" />
        <div className="absolute -top-40 -right-32 h-[380px] w-[560px] rounded-full bg-violet-500/[0.07] blur-3xl dark:bg-indigo-500/[0.08]" />
        <div className="absolute bottom-[-260px] left-1/3 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-cyan-400/[0.05] blur-3xl dark:bg-brand-500/[0.06]" />
      </div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <Navbar onOpenMobile={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main
          id="main-content"
          className={cn("mx-auto w-full max-w-[1400px] flex-1", isAssistant ? "p-0 sm:p-4 lg:p-6" : "px-4 py-6 sm:px-6 lg:px-8 lg:py-8")}
        >
          <ErrorBoundary key={location.pathname}>
            <div key={location.pathname} className="animate-slide-up">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
