/**
 * HTTP client for the UU Student Hub API.
 *
 * The app can run in two modes:
 *   • "api"   — data lives on the Express/SQLite backend (VITE_API_URL is set and reachable)
 *   • "local" — the original browser-only demo, everything in localStorage
 *
 * Mode is resolved once at boot (see resolveRuntimeMode) so a build with a
 * configured API still works offline by falling back to localStorage instead
 * of showing a broken login screen.
 */

const RAW_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const HEALTH_URL = import.meta.env.VITE_API_HEALTH_URL || (RAW_BASE ? `${RAW_BASE}/health` : "");

const TOKEN_KEY = "uu_token";

let mode = RAW_BASE ? "api" : "local";

export const configuredApiUrl = RAW_BASE;
export const isApiMode = () => mode === "api";
export const runtimeMode = () => mode;

/* ── token ─────────────────────────────────────────────────────── */

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/* ── mode resolution ───────────────────────────────────────────── */

/** Ping the backend once before the first render; fall back to localStorage when it is down. */
export async function resolveRuntimeMode({ timeout = 2500 } = {}) {
  if (!RAW_BASE) {
    mode = "local";
    return mode;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timer);
    mode = res.ok ? "api" : "local";
  } catch {
    mode = "local";
    console.warn(`[api] ${RAW_BASE} is unreachable — running in local (localStorage) mode.`);
  }

  return mode;
}

/** Force local mode (used when the session becomes invalid). */
export const useLocalMode = () => {
  mode = "local";
};

/* ── errors ────────────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(message, { status = 0, code = "ERROR", details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const NETWORK_MESSAGE = "Can't reach the server. Make sure the API is running (npm run dev:server).";

/* ── request ───────────────────────────────────────────────────── */

/**
 * Perform an API request and return the unwrapped `data` payload.
 * Auth failures clear the stored token and notify the app via `uu:unauthorized`.
 */
export async function api(path, { method = "GET", body, signal, auth = true, headers = {} } = {}) {
  if (mode !== "api") throw new ApiError("API mode is not active.", { code: "OFFLINE" });

  const requestHeaders = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) requestHeaders["Content-Type"] = "application/json";

  const token = auth ? getToken() : null;
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(RAW_BASE + path, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiError(NETWORK_MESSAGE, { code: "NETWORK" });
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new CustomEvent("uu:unauthorized"));
    }
    throw new ApiError(payload?.error || `Request failed (${res.status}).`, {
      status: res.status,
      code: payload?.code || "ERROR",
      details: payload?.details,
    });
  }

  return payload?.data;
}

/** The chat endpoint answers with `{ reply }` (documented contract), not `{ data }`. */
export async function apiChat(messages, { signal } = {}) {
  const res = await fetch(`${RAW_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: JSON.stringify({ messages }),
    signal,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new CustomEvent("uu:unauthorized"));
    }
    throw new ApiError(payload?.error || `AI service error (${res.status})`, { status: res.status });
  }
  return payload?.reply ?? "";
}
