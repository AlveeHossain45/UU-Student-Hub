export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const pad = (n) => String(n).padStart(2, "0");

/** "14:30" -> minutes since midnight */
export const timeToMinutes = (t = "00:00") => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** "14:30" -> "02:30 PM" */
export const formatTime12 = (t = "00:00") => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${pad(hh)}:${pad(m || 0)} ${suffix}`;
};

export const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toDateTimeInput = (d) => `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Build a Date from "YYYY-MM-DD" and "HH:mm" in local time */
export const combineDateTime = (date, time = "00:00") => {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, m || 0);
};

export const formatDate = (value, opts = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value.length === 10 ? value + "T00:00" : value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", opts);
};

export const formatDateTime = (value) => {
  const d = new Date(value);
  if (isNaN(d)) return "";
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export const relativeTime = (value, now = new Date()) => {
  const d = new Date(value);
  const diff = d - now;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const hr = Math.round(abs / 3600000);
  const day = Math.round(abs / 86400000);
  let str;
  if (min < 1) return "just now";
  if (min < 60) str = `${min} min`;
  else if (hr < 24) str = `${hr} hour${hr > 1 ? "s" : ""}`;
  else str = `${day} day${day > 1 ? "s" : ""}`;
  return diff > 0 ? `in ${str}` : `${str} ago`;
};

/** Human countdown e.g. "35 minutes", "2h 10m", "3d 4h" */
export const humanCountdown = (ms) => {
  if (ms <= 0) return "now";
  const totalMin = Math.ceil(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} minute${m === 1 ? "" : "s"}`;
};

export const splitDuration = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
};

export const getGreeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

/** Skip common Bangladeshi honorific prefixes so "Mohammad Alvee Hossain" -> "Alvee" */
export const getFirstName = (name = "") => {
  const parts = name.trim().split(/\s+/);
  const skip = ["md", "md.", "mohammad", "mohammed", "muhammad", "mohd", "mst", "mst.", "sheikh"];
  const found = parts.find((p) => !skip.includes(p.toLowerCase()));
  return found || parts[0] || "Student";
};

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "U";

/** Effective status of an assignment (auto-overdue) */
export const getAssignmentStatus = (a, now = new Date()) => {
  if (a.status === "completed") return "completed";
  if (a.status === "overdue") return "overdue";
  if (new Date(a.deadline) < now) return "overdue";
  return a.status;
};

/** Find the current / next class across the week. */
export const getNextClass = (routine, now = new Date()) => {
  if (!routine?.length) return null;
  const today = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (let offset = 0; offset < 8; offset++) {
    const day = (today + offset) % 7;
    const classes = routine
      .filter((c) => Number(c.day) === day)
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    for (const c of classes) {
      const startMin = timeToMinutes(c.start);
      const endMin = timeToMinutes(c.end);
      if (offset === 0 && endMin <= nowMin) continue;
      const base = addDays(now, offset);
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(startMin / 60), startMin % 60);
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(endMin / 60), endMin % 60);
      const status = offset === 0 && startMin <= nowMin ? "ongoing" : "upcoming";
      return { cls: c, start, end, status, offset };
    }
  }
  return null;
};

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** UGC uniform grading system used by Uttara University */
export const GRADE_SCALE = [
  { grade: "A+", point: 4.0, range: "80–100" },
  { grade: "A", point: 3.75, range: "75–79" },
  { grade: "A-", point: 3.5, range: "70–74" },
  { grade: "B+", point: 3.25, range: "65–69" },
  { grade: "B", point: 3.0, range: "60–64" },
  { grade: "B-", point: 2.75, range: "55–59" },
  { grade: "C+", point: 2.5, range: "50–54" },
  { grade: "C", point: 2.25, range: "45–49" },
  { grade: "D", point: 2.0, range: "40–44" },
  { grade: "F", point: 0.0, range: "0–39" },
];

export const gradePoint = (g) => GRADE_SCALE.find((x) => x.grade === g)?.point ?? 0;

export const COURSE_COLORS = ["blue", "violet", "emerald", "amber", "rose", "cyan", "indigo", "teal"];

export const colorClasses = {
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500", ring: "ring-blue-500/20" },
  violet: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500", ring: "ring-violet-500/20" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", ring: "ring-emerald-500/20" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", ring: "ring-amber-500/20" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", ring: "ring-rose-500/20" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", bar: "bg-cyan-500", ring: "ring-cyan-500/20" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500", ring: "ring-indigo-500/20" },
  teal: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", bar: "bg-teal-500", ring: "ring-teal-500/20" },
};

export const getColor = (c) => colorClasses[c] || colorClasses.blue;
