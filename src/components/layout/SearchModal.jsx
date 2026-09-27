import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardList, CornerDownLeft, FileClock, Megaphone, Search, ArrowUp, ArrowDown } from "lucide-react";
import { useData } from "../../context/DataContext";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/helpers";
import { MAIN_NAV, BOTTOM_NAV } from "./navItems";

const GROUP_ICONS = { Courses: BookOpen, Assignments: ClipboardList, Notices: Megaphone, Exams: FileClock };

export default function SearchModal({ open, onClose }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { courses, assignments, notices, exams } = useData();

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const match = (...fields) => fields.some((f) => String(f || "").toLowerCase().includes(term));
    if (!term) {
      return [...MAIN_NAV, ...BOTTOM_NAV].map((n) => ({ id: n.to, group: "Pages", title: n.label, subtitle: "Go to page", icon: n.icon, to: n.to }));
    }
    const out = [];
    courses.items
      .filter((c) => match(c.code, c.name, c.instructor))
      .slice(0, 5)
      .forEach((c) => out.push({ id: "c" + c.id, group: "Courses", title: `${c.code} · ${c.name}`, subtitle: c.instructor, to: "/courses", state: { openId: c.id } }));
    assignments.items
      .filter((a) => match(a.title, a.course, a.description))
      .slice(0, 5)
      .forEach((a) => out.push({ id: "a" + a.id, group: "Assignments", title: a.title, subtitle: `${a.course} · due ${formatDate(a.deadline)}`, to: "/assignments", state: { search: a.title } }));
    exams.items
      .filter((e) => match(e.title, e.course, e.type, e.room))
      .slice(0, 5)
      .forEach((e) => out.push({ id: "e" + e.id, group: "Exams", title: `${e.title} ${e.type}`, subtitle: `${e.course} · ${formatDate(e.date)} · ${e.room}`, to: "/exams" }));
    notices.items
      .filter((n) => match(n.title, n.category, n.description))
      .slice(0, 5)
      .forEach((n) => out.push({ id: "n" + n.id, group: "Notices", title: n.title, subtitle: `${n.category} · ${formatDate(n.date)}`, to: "/notices", state: { openId: n.id } }));
    return out;
  }, [q, courses.items, assignments.items, notices.items, exams.items]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (r) => {
    if (!r) return;
    navigate(r.to, { state: r.state });
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[10vh] sm:p-6 sm:pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-zinc-950/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-ink-600 dark:bg-ink-900"
      >
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-ink-700">
          <Search size={18} className="shrink-0 text-zinc-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, assignments, notices, exams…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            className="h-14 w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          <kbd className="hidden rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:block dark:border-ink-600">ESC</kbd>
        </div>
        <div ref={listRef} id="search-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No results for “{q}”</p>
              <p className="mt-1 text-xs text-zinc-500">Try searching for a course code like “CSE 221”.</p>
            </div>
          ) : (
            results.map((r, i) => {
              const showGroup = r.group !== lastGroup;
              lastGroup = r.group;
              const Icon = r.icon || GROUP_ICONS[r.group] || Search;
              return (
                <div key={r.id}>
                  {showGroup && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{r.group}</p>}
                  <button
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      i === active ? "bg-zinc-100 dark:bg-ink-700" : "hover:bg-zinc-50 dark:hover:bg-ink-800"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-400">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.title}</span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{r.subtitle}</span>
                    </span>
                    {i === active && <CornerDownLeft size={14} className="shrink-0 text-zinc-400" aria-hidden="true" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="hidden items-center gap-4 border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-400 sm:flex dark:border-ink-700">
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={12} />
            <ArrowDown size={12} /> Navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={12} /> Open
          </span>
          <span className="ml-auto">UU Student Hub Search</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
