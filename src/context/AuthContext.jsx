import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { DEMO_USER } from "../data/mockData";
import { delay, uid } from "../utils/helpers";
import { api, getToken, isApiMode, setToken } from "../services/api";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);
const SESSION_KEY = "uu_session";

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────────
 * API-backed auth — used when the Express backend is reachable.
 * Same public surface as the local provider so pages never branch.
 * ───────────────────────────────────────────────────────────────── */
function ApiAuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    const hadToken = Boolean(getToken());
    setToken(null);
    setUser(null);
    if (hadToken) api("/auth/logout", { method: "POST", body: {} }).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (getToken()) {
        try {
          const data = await api("/auth/me");
          if (alive) setUser(data.user);
        } catch {
          if (alive) setUser(null);
        }
      }
      if (alive) setInitializing(false);
    })();

    // The API client emits this when the server rejects the token.
    const onUnauthorized = () => {
      if (alive) setUser(null);
    };
    window.addEventListener("uu:unauthorized", onUnauthorized);
    return () => {
      alive = false;
      window.removeEventListener("uu:unauthorized", onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password, remember }, auth: false });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const data = await api("/auth/register", { method: "POST", body: payload, auth: false });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const updateProfile = useCallback(
    (patch) => {
      api("/users/me", { method: "PUT", body: patch })
        .then((data) => setUser(data.user))
        .catch((err) => toast.error("Couldn't save your profile", err.message));
    },
    [toast]
  );

  const changePassword = useCallback(async (current, next) => {
    try {
      await api("/users/me/password", { method: "POST", body: { current, next } });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, initializing, login, register, logout, updateProfile, changePassword }),
    [user, initializing, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─────────────────────────────────────────────────────────────────
 * Local (localStorage) auth — the original frontend-only demo.
 * ───────────────────────────────────────────────────────────────── */
function LocalAuthProvider({ children }) {
  const [users, setUsers] = useLocalStorage("uu_users", [DEMO_USER]);
  const [session, setSession] = useState(readSession);

  const user = useMemo(() => {
    if (!session) return null;
    const found = users.find((u) => u.email.toLowerCase() === session.email.toLowerCase());
    if (!found) return null;
    // eslint-disable-next-line no-unused-vars
    const { password, ...safe } = found;
    return safe;
  }, [users, session]);

  const startSession = (email, remember) => {
    const s = { email, at: Date.now() };
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  const login = useCallback(
    async (email, password, remember = true) => {
      await delay(700);
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return { ok: false, error: "No account found with this email." };
      if (found.password !== password) return { ok: false, error: "Incorrect password. Please try again." };
      startSession(found.email, remember);
      return { ok: true };
    },
    [users]
  );

  const register = useCallback(
    async (data) => {
      await delay(800);
      if (users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
        return { ok: false, error: "An account with this email already exists." };
      }
      if (users.some((u) => u.studentId.toLowerCase() === data.studentId.trim().toLowerCase())) {
        return { ok: false, error: "This Student ID is already registered." };
      }
      const newUser = {
        id: uid(),
        name: data.name.trim(),
        studentId: data.studentId.trim(),
        email: data.email.trim(),
        password: data.password,
        university: "Uttara University",
        department: data.department,
        program: `B.Sc. / Bachelor in ${data.department}`,
        semester: data.semester,
        batch: "",
        phone: "",
        bio: "",
        avatar: "",
        cgpa: 0,
        creditsCompleted: 0,
        coursesCompleted: 0,
        attendance: 100,
      };
      setUsers((prev) => [...prev, newUser]);
      startSession(newUser.email, true);
      return { ok: true };
    },
    [users, setUsers]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    (patch) => {
      if (!session) return;
      setUsers((prev) => prev.map((u) => (u.email === session.email ? { ...u, ...patch, email: u.email } : u)));
    },
    [session, setUsers]
  );

  const changePassword = useCallback(
    async (current, next) => {
      await delay(600);
      const found = users.find((u) => u.email === session?.email);
      if (!found || found.password !== current) return { ok: false, error: "Current password is incorrect." };
      setUsers((prev) => prev.map((u) => (u.email === session.email ? { ...u, password: next } : u)));
      return { ok: true };
    },
    [users, session, setUsers]
  );

  const value = {
    user,
    isAuthenticated: !!user,
    initializing: false,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Switches between the API and localStorage providers at boot. */
export function AuthProvider({ children }) {
  return isApiMode() ? <ApiAuthProvider>{children}</ApiAuthProvider> : <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
