import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Megaphone, CheckCheck, Calendar, Pin, MailOpen, Mail } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Badge, { CATEGORY_META } from "../components/ui/Badge";
import NoticeCard from "../components/NoticeCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { ListSkeleton } from "../components/ui/LoadingSkeleton";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { NOTICE_CATEGORIES } from "../data/mockData";
import { cn } from "../utils/cn";
import { formatDate } from "../utils/helpers";

export default function Notices() {
  useDocumentTitle("Notices");
  const { notices, loading, error, reload, markNoticeRead, markAllNoticesRead } = useData();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (location.state?.openId) {
      setOpenId(location.state.openId);
      markNoticeRead(location.state.openId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const unread = notices.items.filter((n) => !n.read).length;
  const counts = useMemo(() => {
    const c = { All: notices.items.length };
    NOTICE_CATEGORIES.forEach((k) => (c[k] = notices.items.filter((n) => n.category === k).length));
    return c;
  }, [notices.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices.items
      .filter((n) => (category === "All" || n.category === category) && (!unreadOnly || !n.read) && (!q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.date) - new Date(a.date));
  }, [notices.items, search, category, unreadOnly]);

  const open = notices.items.find((n) => n.id === openId);

  const openNotice = (n) => {
    setOpenId(n.id);
    if (!n.read) markNoticeRead(n.id);
  };

  if (error) return <ErrorState description={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Notice Center"
        description="Official announcements from Uttara University."
        actions={
          <Button
            variant="outline"
            icon={CheckCheck}
            disabled={!unread}
            onClick={() => {
              markAllNoticesRead();
              toast.success("All notices marked as read.");
            }}
          >
            Mark all as read
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input icon={Search} placeholder="Search notices…" aria-label="Search notices" value={search} onChange={(e) => setSearch(e.target.value)} className="lg:w-80" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Unread only <span className="rounded-full bg-brand-50 px-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{unread}</span>
        </label>
      </div>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter by category">
        {["All", ...NOTICE_CATEGORIES].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              category === c
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-ink-600 dark:bg-ink-900 dark:text-zinc-300 dark:hover:border-ink-500"
            )}
          >
            {c}
            <span className="text-xs opacity-60">{counts[c]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices available." description={search || category !== "All" || unreadOnly ? "Try clearing your filters." : "New university notices will appear here."} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((n) => (
            <NoticeCard key={n.id} notice={n} onClick={() => openNotice(n)} />
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpenId(null)} size="lg" title="Notice details">
        {open && (
          <article>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={CATEGORY_META[open.category]?.tone}>{open.category}</Badge>
              {open.pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Pin size={12} /> Pinned
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <Calendar size={12} /> {formatDate(open.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-snug text-zinc-900 dark:text-white">{open.title}</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">{open.description}</p>
            <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-500 dark:bg-ink-800 dark:text-zinc-400">
              Issued by the Office of the Registrar, Uttara University. For queries contact the respective department office.
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={open.read ? Mail : MailOpen}
                onClick={() => {
                  markNoticeRead(open.id, !open.read);
                  toast.info(open.read ? "Marked as unread." : "Marked as read.");
                }}
              >
                {open.read ? "Mark as unread" : "Mark as read"}
              </Button>
            </div>
          </article>
        )}
      </Modal>
    </div>
  );
}
