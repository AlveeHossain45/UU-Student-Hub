import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ClipboardList,
  FileClock,
  Calculator,
  Megaphone,
  Sparkles,
  UserRound,
  Settings,
} from "lucide-react";

export const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/routine", label: "Routine", icon: CalendarDays },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList, badgeKey: "assignments" },
  { to: "/exams", label: "Exams", icon: FileClock },
  { to: "/cgpa", label: "CGPA", icon: Calculator },
  { to: "/notices", label: "Notices", icon: Megaphone, badgeKey: "notices" },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles, tag: "AI" },
];

export const BOTTOM_NAV = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];
