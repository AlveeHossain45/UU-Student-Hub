import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import useApiCollection from "../hooks/useApiCollection";
import { api, isApiMode } from "../services/api";
import {
  initialAssignments,
  initialCourses,
  initialExams,
  initialNotices,
  initialNotifications,
  initialRoutine,
  initialSettings,
} from "../data/mockData";
import { uid } from "../utils/helpers";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

const KEYS = {
  courses: "uu_courses",
  routine: "uu_routine",
  assignments: "uu_assignments",
  exams: "uu_exams",
  notices: "uu_notices",
  notifications: "uu_notifications",
  settings: "uu_settings",
};

/* ─────────────────────────────────────────────────────────────────
 * Local mode — the original browser-only demo backed by localStorage.
 * ───────────────────────────────────────────────────────────────── */

/** Generic CRUD helpers for a list stored in state */
function useCollection(key, initial) {
  const [items, setItems] = useLocalStorage(key, initial);
  const safe = Array.isArray(items) ? items : [];
  const add = useCallback((item) => {
    const created = { ...item, id: uid() };
    setItems((p) => [created, ...(Array.isArray(p) ? p : [])]);
    return created;
  }, [setItems]);
  const update = useCallback((id, patch) => setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))), [setItems]);
  const remove = useCallback((id) => setItems((p) => p.filter((x) => x.id !== id)), [setItems]);
  return { items: safe, setItems, add, update, remove, corrupted: !Array.isArray(items) };
}

function LocalDataProvider({ children }) {
  const courses = useCollection(KEYS.courses, initialCourses);
  const routine = useCollection(KEYS.routine, initialRoutine);
  const assignments = useCollection(KEYS.assignments, initialAssignments);
  const exams = useCollection(KEYS.exams, initialExams);
  const notices = useCollection(KEYS.notices, initialNotices);
  const notifications = useCollection(KEYS.notifications, initialNotifications);
  const [settings, setSettings] = useLocalStorage(KEYS.settings, initialSettings);

  // Simulated network latency so loading skeletons are visible on first load
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const error =
    courses.corrupted || routine.corrupted || assignments.corrupted || exams.corrupted || notices.corrupted
      ? "Some of your saved data could not be read."
      : null;

  const resetAll = useCallback(() => {
    courses.setItems(initialCourses);
    routine.setItems(initialRoutine);
    assignments.setItems(initialAssignments);
    exams.setItems(initialExams);
    notices.setItems(initialNotices);
    notifications.setItems(initialNotifications);
    setSettings(initialSettings);
  }, [courses, routine, assignments, exams, notices, notifications, setSettings]);

  const reload = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  const markNoticeRead = useCallback((id, read = true) => notices.update(id, { read }), [notices]);
  const markAllNoticesRead = useCallback(() => notices.setItems((p) => p.map((n) => ({ ...n, read: true }))), [notices]);
  const markNotificationRead = useCallback((id) => notifications.update(id, { read: true }), [notifications]);
  const markAllNotificationsRead = useCallback(
    () => notifications.setItems((p) => p.map((n) => ({ ...n, read: true }))),
    [notifications]
  );
  const pushNotification = useCallback(
    (n) => notifications.setItems((p) => [{ id: uid(), time: new Date().toISOString(), read: false, ...n }, ...p].slice(0, 30)),
    [notifications]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      reload,
      resetAll,
      courses,
      routine,
      assignments,
      exams,
      notices,
      notifications,
      settings: { ...initialSettings, ...(settings || {}) },
      setSettings,
      markNoticeRead,
      markAllNoticesRead,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
    }),
    [loading, error, reload, resetAll, courses, routine, assignments, exams, notices, notifications, settings, setSettings, markNoticeRead, markAllNoticesRead, markNotificationRead, markAllNotificationsRead, pushNotification]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ─────────────────────────────────────────────────────────────────
 * API mode — every collection lives in SQLite behind the REST API.
 * ───────────────────────────────────────────────────────────────── */
function ApiDataProvider({ children }) {
  const toast = useToast();

  const courses = useApiCollection("/courses");
  const routine = useApiCollection("/routine");
  const assignments = useApiCollection("/assignments");
  const exams = useApiCollection("/exams");
  const notices = useApiCollection("/notices");
  const notifications = useApiCollection("/notifications");

  const [settings, setSettingsState] = useState(initialSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    setSettingsLoaded(false);

    api("/settings")
      .then((data) => {
        if (!cancelled) setSettingsState({ ...initialSettings, ...(data || {}) });
      })
      .catch((err) => {
        if (!cancelled) console.error("[settings]", err.message);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const setSettings = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(settingsRef.current) : updater;
      settingsRef.current = next;
      setSettingsState(next);
      api("/settings", { method: "PUT", body: next }).catch((err) => toast.error("Couldn't save settings", err.message));
    },
    [toast]
  );

  const loading = !(courses.loaded && routine.loaded && assignments.loaded && exams.loaded && notices.loaded && notifications.loaded && settingsLoaded);
  const error = courses.error || routine.error || assignments.error || exams.error || notices.error || notifications.error || null;

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
    [courses, routine, assignments, exams, notices, notifications].forEach((c) => c.reload());
  }, [courses, routine, assignments, exams, notices, notifications]);

  const resetAll = useCallback(async () => {
    try {
      await api("/users/me/reset", { method: "POST", body: {} });
      setSettingsState(initialSettings);
      settingsRef.current = initialSettings;
      reload();
      return true;
    } catch (err) {
      toast.error("Couldn't reset your data", err.message);
      return false;
    }
  }, [reload, toast]);

  const markNoticeRead = useCallback(
    (id, read = true) => {
      notices.setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
      api(`/notices/${id}/read`, { method: "PUT", body: { read } }).catch((err) => {
        toast.error("Couldn't update the notice", err.message);
        notices.reload();
      });
    },
    [notices, toast]
  );

  const markAllNoticesRead = useCallback(() => {
    notices.setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    api("/notices/read-all", { method: "POST", body: {} }).catch((err) => {
      toast.error("Couldn't update notices", err.message);
      notices.reload();
    });
  }, [notices, toast]);

  const markNotificationRead = useCallback(
    (id) => {
      notifications.setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      api(`/notifications/${id}`, { method: "PATCH", body: { read: true } }).catch((err) => {
        toast.error("Couldn't update the notification", err.message);
        notifications.reload();
      });
    },
    [notifications, toast]
  );

  const markAllNotificationsRead = useCallback(() => {
    notifications.setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    api("/notifications/read-all", { method: "POST", body: {} }).catch((err) => {
      toast.error("Couldn't update notifications", err.message);
      notifications.reload();
    });
  }, [notifications, toast]);

  const pushNotification = useCallback(
    (n) => {
      api("/notifications", { method: "POST", body: n })
        .then((created) => notifications.setItems((prev) => [created, ...prev].slice(0, 30)))
        .catch((err) => console.error("[notification]", err.message));
    },
    [notifications]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      reload,
      resetAll,
      courses,
      routine,
      assignments,
      exams,
      notices,
      notifications,
      settings,
      setSettings,
      markNoticeRead,
      markAllNoticesRead,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
    }),
    [loading, error, reload, resetAll, courses, routine, assignments, exams, notices, notifications, settings, setSettings, markNoticeRead, markAllNoticesRead, markNotificationRead, markAllNotificationsRead, pushNotification]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/** Safe, empty payload while nobody is signed in (nothing should read it yet). */
const EMPTY_COLLECTION = Object.freeze({
  items: [],
  setItems: () => {},
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  reload: () => {},
  error: null,
  loaded: false,
  loading: true,
});

const EMPTY_CONTEXT = Object.freeze({
  loading: true,
  error: null,
  reload: () => {},
  resetAll: async () => false,
  courses: EMPTY_COLLECTION,
  routine: EMPTY_COLLECTION,
  assignments: EMPTY_COLLECTION,
  exams: EMPTY_COLLECTION,
  notices: EMPTY_COLLECTION,
  notifications: EMPTY_COLLECTION,
  settings: initialSettings,
  setSettings: () => {},
  markNoticeRead: () => {},
  markAllNoticesRead: () => {},
  markNotificationRead: () => {},
  markAllNotificationsRead: () => {},
  pushNotification: () => {},
});

/**
 * Picks the storage backend once the runtime mode has been resolved.
 * In API mode the data provider is keyed by the signed-in user so it only
 * fetches once a session exists (never on the login screen) and starts fresh
 * when the account changes.
 */
export function DataProvider({ children }) {
  const auth = useAuth();

  if (!isApiMode()) return <LocalDataProvider>{children}</LocalDataProvider>;

  if (auth.initializing || !auth.user) {
    return <DataContext.Provider value={EMPTY_CONTEXT}>{children}</DataContext.Provider>;
  }

  return <ApiDataProvider key={auth.user.id}>{children}</ApiDataProvider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
