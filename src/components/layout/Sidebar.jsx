import { NavLink, useNavigate } from "react-router-dom";
import { ChevronsLeft, LogOut, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Logo from "../Logo";
import { BOTTOM_NAV, MAIN_NAV } from "./navItems";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { getAssignmentStatus } from "../../utils/helpers";

function NavItem({ item, collapsed, badge, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-zinc-900 text-white shadow-sm dark:bg-white/[0.08] dark:text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-3 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 dark:block" aria-hidden="true" />}
          <Icon size={18} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && item.tag && (
            <span className="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-300">{item.tag}</span>
          )}
          {badge > 0 &&
            (collapsed ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-ink-900" aria-label={`${badge} new`} />
            ) : (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-ink-700 dark:text-zinc-300"
                )}
              >
                {badge}
              </span>
            ))}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { logout } = useAuth();
  const { assignments, notices } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const now = new Date();
  const badges = {
    assignments: assignments.items.filter((a) => ["pending", "in-progress"].includes(getAssignmentStatus(a, now))).length,
    notices: notices.items.filter((n) => !n.read).length,
  };

  const handleLogout = () => {
    logout();
    toast.info("Signed out", "See you soon! 👋");
    navigate("/login", { replace: true });
  };

  const content = (isMobile) => {
    const c = isMobile ? false : collapsed;
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex h-16 shrink-0 items-center border-b border-zinc-200/70 px-4 dark:border-ink-700", c ? "justify-center" : "justify-between")}>
          <Logo collapsed={c} />
          {isMobile ? (
            <button onClick={onCloseMobile} aria-label="Close menu" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-ink-700">
              <X size={18} />
            </button>
          ) : (
            !c && (
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
              >
                <ChevronsLeft size={18} />
              </button>
            )
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {!c && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Menu</p>}
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} item={item} collapsed={c} badge={item.badgeKey ? badges[item.badgeKey] : 0} onNavigate={isMobile ? onCloseMobile : undefined} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-zinc-200/70 px-3 py-3 dark:border-ink-700">
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.to} item={item} collapsed={c} onNavigate={isMobile ? onCloseMobile : undefined} />
          ))}
          <button
            onClick={handleLogout}
            title={c ? "Logout" : undefined}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400",
              c && "justify-center px-0"
            )}
          >
            <LogOut size={18} aria-hidden="true" />
            {!c && <span>Logout</span>}
          </button>
          {c && (
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="flex h-10 w-full items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-ink-700"
            >
              <ChevronsLeft size={18} className="rotate-180" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-zinc-200/70 bg-white transition-[width] duration-200 lg:block dark:border-ink-700 dark:bg-ink-900",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {content(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 animate-fade-in bg-zinc-950/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] animate-slide-in-left border-r border-zinc-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900">
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
}
