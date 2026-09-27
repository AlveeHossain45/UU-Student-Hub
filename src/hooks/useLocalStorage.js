import { useEffect, useState } from "react";

/** Read a JSON value from localStorage safely. */
export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return typeof fallback === "function" ? fallback() : fallback;
    return JSON.parse(raw);
  } catch {
    return typeof fallback === "function" ? fallback() : fallback;
  }
}

/** useState that persists to localStorage. */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable – ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
