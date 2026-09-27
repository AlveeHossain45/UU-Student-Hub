import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Search, Settings, UserRound, Sparkles } from "lucide-react";
import Avatar from "../ui/Avatar";
import Dropdown, { DropdownItem, DropdownSeparator } from "../ui/Dropdown";
import ThemeToggle from "./ThemeToggle";
import NotificationPanel from "./NotificationPanel";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { MAIN_NAV, BOTTOM_NAV } from "./navItems";

export default function Navbar({ onOpenMobile, onOpenSearch }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = [...MAIN_NAV, ...BOTTOM_NAV].find((n) => pathname.startsWith(n.to));
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6 dark:border-ink-700 dark:bg-ink-950/80">
      <button
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-ink-700"
      >
        <Menu size={20} />
      </button>

      <p className="truncate text-sm font-semibold text-zinc-900 md:hidden dark:text-zinc-100">{current?.label || "UU Student Hub"}</p>

      <button
        onClick={onOpenSearch}
        className="hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 text-sm text-zinc-400 transition hover:border-zinc-300 hover:bg-white md:flex dark:border-ink-600 dark:bg-ink-850 dark:hover:border-ink-500 dark:hover:bg-ink-800"
        aria-label="Open search"
      >
        <Search size={16} aria-hidden="true" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-400">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-ink-700"
        >
          <Search size={18} />
        </button>
        <NotificationPanel />
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block dark:bg-ink-600" aria-hidden="true" />
        <Dropdown
          trigger={({ toggle, open }) => (
            <button
              onClick={toggle}
              aria-label="Open profile menu"
              aria-expanded={open}
              className="flex items-center gap-2.5 rounded-xl p-1 pr-1.5 transition hover:bg-zinc-100 dark:hover:bg-ink-700"
            >
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{user?.studentId}</span>
              </span>
              <ChevronDown size={14} className="hidden text-zinc-400 sm:block" />
            </button>
          )}
          panelClassName="w-60"
        >
          {({ close }) => (
            <>
              <div className="flex items-center gap-3 px-2.5 py-2">
                <Avatar name={user?.name} src={user?.avatar} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                </div>
              </div>
              <DropdownSeparator />
              <DropdownItem icon={UserRound} onClick={() => { close(); navigate("/profile"); }}>
                My Profile
              </DropdownItem>
              <DropdownItem icon={Sparkles} onClick={() => { close(); navigate("/assistant"); }}>
                AI Assistant
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => { close(); navigate("/settings"); }}>
                Settings
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                icon={LogOut}
                danger
                onClick={() => {
                  close();
                  logout();
                  toast.info("Signed out", "See you soon! 👋");
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
