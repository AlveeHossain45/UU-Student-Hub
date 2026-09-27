import { Bell, BellOff, CalendarClock, CheckCheck, ClipboardList, FileClock, Megaphone, Trash2 } from "lucide-react";
import Dropdown from "../ui/Dropdown";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";
import { relativeTime } from "../../utils/helpers";

const TYPE_META = {
  class: { icon: CalendarClock, cls: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300", setting: "classReminders" },
  assignment: { icon: ClipboardList, cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", setting: "assignmentReminders" },
  exam: { icon: FileClock, cls: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300", setting: "examReminders" },
  notice: { icon: Megaphone, cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300", setting: "noticeAlerts" },
};

export default function NotificationPanel() {
  const { notifications, settings, markNotificationRead, markAllNotificationsRead } = useData();
  const toast = useToast();

  // Respect notification preferences from Settings
  const visible = notifications.items.filter((n) => settings[TYPE_META[n.type]?.setting] !== false);
  const unread = visible.filter((n) => !n.read).length;

  return (
    <Dropdown
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          aria-expanded={open}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-ink-700 dark:hover:text-zinc-100"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-ink-900">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
      panelClassName="fixed inset-x-3 top-[60px] mt-0 p-0 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-ink-700">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{unread ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => {
              markAllNotificationsRead();
              toast.success("All notifications marked as read.");
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-1.5 sm:max-h-[420px]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <BellOff size={22} className="text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">No notifications</p>
            <p className="mt-1 text-xs text-zinc-500">New alerts about classes, deadlines and notices appear here.</p>
          </div>
        ) : (
          visible.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.notice;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-ink-700/50",
                  !n.read && "bg-brand-50/40 dark:bg-brand-500/[0.04]"
                )}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.cls)}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <button className="min-w-0 flex-1 text-left" onClick={() => markNotificationRead(n.id)} aria-label={`Mark "${n.title}" as read`}>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {n.title}
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{n.message}</p>
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{relativeTime(n.time)}</p>
                </button>
                <button
                  onClick={() => {
                    notifications.remove(n.id);
                    toast.info("Notification deleted.");
                  }}
                  aria-label="Delete notification"
                  className="rounded-lg p-1.5 text-zinc-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </Dropdown>
  );
}
