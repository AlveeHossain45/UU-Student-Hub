import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Monitor, Palette, Bell, UserCog, ShieldCheck, CalendarClock, ClipboardList, FileClock, Megaphone, Mail, Eye, GraduationCap, BarChart3, LogOut, RotateCcw, Trash2, Lock, Check } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Switch from "../components/ui/Switch";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { api, getToken, isApiMode, setToken } from "../services/api";
import { cn } from "../utils/cn";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: UserCog },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
];

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemePreview({ mode }) {
  const dark = mode === "dark";
  const half = mode === "system";
  const Panel = ({ d }) => (
    <div className={cn("flex h-full w-full gap-1.5 p-2", d ? "bg-ink-950" : "bg-zinc-50")}>
      <div className={cn("w-1/4 rounded-md", d ? "bg-ink-800" : "bg-white ring-1 ring-zinc-200")} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={cn("h-2.5 rounded", d ? "bg-ink-700" : "bg-zinc-200")} />
        <div className={cn("flex-1 rounded-md", d ? "bg-ink-800" : "bg-white ring-1 ring-zinc-200")}>
          <div className="m-1.5 h-1.5 w-1/2 rounded bg-brand-500" />
        </div>
      </div>
    </div>
  );
  return (
    <div className="flex h-20 overflow-hidden rounded-lg">
      {half ? (
        <>
          <div className="w-1/2 overflow-hidden">
            <Panel d={false} />
          </div>
          <div className="w-1/2 overflow-hidden">
            <Panel d />
          </div>
        </>
      ) : (
        <Panel d={dark} />
      )}
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, description, children }) {
  return (
    <Card as="section" id={id} className="scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-title`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-ink-800 dark:text-zinc-300">
          <Icon size={18} />
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-[15px] font-semibold text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function Settings() {
  useDocumentTitle("Settings");
  const { theme, setTheme } = useTheme();
  const { user, logout, changePassword } = useAuth();
  const { settings, setSettings, resetAll } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [active, setActive] = useState("appearance");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const toggle = (key) => (value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    toast.success("Settings saved.");
  };

  const submitPw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.current) errs.current = "Enter your current password.";
    if (pw.next.length < 6) errs.next = "New password must be at least 6 characters.";
    if (pw.next !== pw.confirm) errs.confirm = "Passwords do not match.";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwLoading(true);
    const res = await changePassword(pw.current, pw.next);
    setPwLoading(false);
    if (!res.ok) return setPwErrors({ current: res.error });
    setPw({ current: "", next: "", confirm: "" });
    toast.success("Password updated.");
  };

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your preferences and account." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:h-fit lg:flex-col lg:px-0" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                active === s.id ? "bg-zinc-900 text-white dark:bg-white/[0.08]" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-ink-800"
              )}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          <SectionCard id="appearance" icon={Palette} title="Appearance" description="Choose how UU Student Hub looks to you.">
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  role="radio"
                  aria-checked={theme === t.value}
                  onClick={() => {
                    setTheme(t.value);
                    toast.success("Settings saved.", `Theme set to ${t.label}.`);
                  }}
                  className={cn(
                    "rounded-2xl border-2 p-2 text-left transition",
                    theme === t.value ? "border-brand-500 dark:border-brand-400" : "border-zinc-200 hover:border-zinc-300 dark:border-ink-600 dark:hover:border-ink-500"
                  )}
                >
                  <ThemePreview mode={t.value} />
                  <div className="flex items-center justify-between px-1 pb-0.5 pt-2.5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      <t.icon size={15} /> {t.label}
                    </span>
                    {theme === t.value && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white dark:bg-brand-500">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="notifications" icon={Bell} title="Notifications" description="Choose which reminders appear in your notification center.">
            <div className="divide-y divide-zinc-100 dark:divide-ink-700">
              <Switch icon={CalendarClock} label="Class reminders" description="Get notified before each class starts." checked={settings.classReminders} onChange={toggle("classReminders")} />
              <Switch icon={ClipboardList} label="Assignment reminders" description="Deadline alerts 24 hours in advance." checked={settings.assignmentReminders} onChange={toggle("assignmentReminders")} />
              <Switch icon={FileClock} label="Exam reminders" description="Countdown alerts for upcoming exams." checked={settings.examReminders} onChange={toggle("examReminders")} />
              <Switch icon={Megaphone} label="University notices" description="New official notices from Uttara University." checked={settings.noticeAlerts} onChange={toggle("noticeAlerts")} />
              <Switch icon={Mail} label="Weekly email digest" description="A summary of your week, every Saturday." checked={settings.emailDigest} onChange={toggle("emailDigest")} />
            </div>
          </SectionCard>

          <SectionCard id="account" icon={UserCog} title="Account" description={`Signed in as ${user?.email}`}>
            <form onSubmit={submitPw} className="space-y-4" noValidate>
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <Lock size={15} /> Change password
              </p>
              <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} error={pwErrors.current} autoComplete="current-password" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} error={pwErrors.next} autoComplete="new-password" />
                <Input label="Confirm new password" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} error={pwErrors.confirm} autoComplete="new-password" />
              </div>
              <Button type="submit" loading={pwLoading}>
                Update password
              </Button>
            </form>
            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-ink-700">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Sign out</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">End your session on this device.</p>
              </div>
              <Button
                variant="outline"
                icon={LogOut}
                onClick={() => {
                  logout();
                  toast.info("Signed out", "See you soon! 👋");
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </Button>
            </div>
          </SectionCard>

          <SectionCard id="privacy" icon={ShieldCheck} title="Privacy" description="Control your data and visibility.">
            <div className="divide-y divide-zinc-100 dark:divide-ink-700">
              <Switch icon={Eye} label="Public profile" description="Allow classmates to view your profile." checked={settings.profilePublic} onChange={toggle("profilePublic")} />
              <Switch icon={GraduationCap} label="Show CGPA on profile" description="Display your CGPA on your profile page." checked={settings.showCgpa} onChange={toggle("showCgpa")} />
              <Switch icon={BarChart3} label="Share anonymous usage data" description="Help us improve UU Student Hub." checked={settings.analytics} onChange={toggle("analytics")} />
            </div>
            <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-2 dark:border-ink-700">
              <Button variant="outline" icon={RotateCcw} onClick={() => setConfirm("reset")}>
                Reset demo data
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => setConfirm("wipe")}>
                Delete all local data
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        tone="primary"
        title="Reset demo data?"
        description="Courses, routine, assignments, exams, notices and notifications will be restored to the original demo data."
        confirmText="Reset data"
        onConfirm={() => {
          Promise.resolve(resetAll()).then((result) => {
            if (result !== false) toast.success("Demo data restored.");
          });
        }}
      />
      <ConfirmDialog
        open={confirm === "wipe"}
        onClose={() => setConfirm(null)}
        title={isApiMode() ? "Delete your account?" : "Delete all local data?"}
        description={
          isApiMode()
            ? "This permanently removes your account and every record stored for it on the server. You will be signed out."
            : "This removes every account, setting and record stored by UU Student Hub in this browser. You'll be signed out."
        }
        confirmText={isApiMode() ? "Delete account" : "Delete everything"}
        tone="danger"
        onConfirm={async () => {
          if (isApiMode()) {
            try {
              if (getToken()) await api("/users/me", { method: "DELETE", body: {} });
            } catch {
              /* session may already be gone */
            }
            setToken(null);
          } else {
            Object.keys(localStorage)
              .filter((k) => k.startsWith("uu_"))
              .forEach((k) => localStorage.removeItem(k));
            sessionStorage.removeItem("uu_session");
          }
          window.location.hash = "#/login";
          window.location.reload();
        }}
      />
    </div>
  );
}
