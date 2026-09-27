import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

/**
 * CRUD collection backed by the REST API.
 * Exposes the same surface as the localStorage collection
 * ({ items, add, update, remove, reload, error, loaded }) so pages do not
 * need to know which mode the app is running in.
 */
export default function useApiCollection(path) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const data = await api(path);
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setError(err.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, reloadKey]);

  const reload = useCallback(() => {
    setLoaded(false);
    setReloadKey((k) => k + 1);
  }, []);

  /** Run a mutation, surfacing failures as a toast. */
  const guard = useCallback(
    async (fn) => {
      try {
        return await fn();
      } catch (err) {
        if (err?.name !== "AbortError") toast.error("Couldn't save changes", err.message);
        throw err;
      }
    },
    [toast]
  );

  const add = useCallback(
    (data) =>
      guard(async () => {
        const created = await api(path, { method: "POST", body: data });
        if (alive.current) setItems((prev) => [created, ...prev]);
        return created;
      }),
    [path, guard]
  );

  const update = useCallback(
    (id, patch) =>
      guard(async () => {
        const updated = await api(`${path}/${id}`, { method: "PATCH", body: patch });
        if (alive.current) setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
        return updated;
      }),
    [path, guard]
  );

  const remove = useCallback(
    (id) =>
      guard(async () => {
        await api(`${path}/${id}`, { method: "DELETE" });
        if (alive.current) setItems((prev) => prev.filter((x) => x.id !== id));
        return { id };
      }),
    [path, guard]
  );

  /** Replace local state without a round trip (used by notice/notification flags). */
  const apply = useCallback((updater) => {
    if (alive.current) setItems((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  return { items, setItems: apply, add, update, remove, reload, error, loaded, loading: !loaded && !error };
}
