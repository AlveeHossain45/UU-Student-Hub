import { get, nowIso, run, transaction } from "../db/index.js";
import { seedUserData } from "../db/seed.js";
import { asyncHandler, conflict, unauthorized } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { signAccessToken, rowId } from "../lib/tokens.js";
import { loginSchema, parse, registerSchema } from "../lib/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { config } from "../config.js";

/** "7d" | "12h" | "30m" | "45s" -> milliseconds */
export function durationMs(value) {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(String(value).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = (match[2] || "d").toLowerCase();
  const factor = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * factor;
}

export const TOKEN_TTL_MS = durationMs(config.jwt.expiresIn);

/** Computed once so unknown-email logins cost the same as real ones. */
const DUMMY_HASH = hashPassword(rowId("dummy"));

/** Public projection of a user row — never leaks passwordHash. */
export function publicUser(row) {
  if (!row) return null;
  const { passwordHash, ...user } = row;
  void passwordHash;
  return user;
}

export function createSession(userId, req) {
  const sessionId = rowId("sess");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  run(
    `INSERT INTO sessions (id, userId, createdAt, expiresAt, userAgent, ip) VALUES (?, ?, ?, ?, ?, ?)`,
    sessionId,
    userId,
    nowIso(),
    expiresAt,
    String(req.headers["user-agent"] || "").slice(0, 300),
    req.ip || ""
  );
  return { token: signAccessToken({ userId, sessionId }), expiresAt, sessionId };
}

function purgeExpiredSessions() {
  run("DELETE FROM sessions WHERE expiresAt < ?", nowIso());
}

export function attachSession(res, session) {
  // The SPA stores the token itself; we expose expiry so it can refresh proactively.
  res.setHeader("X-Session-Expires", session.expiresAt);
}

export const register = [
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(registerSchema, req.body ?? {});
    const email = input.email.toLowerCase();

    if (get("SELECT id FROM users WHERE email = ?", email)) {
      throw conflict("An account with this email already exists.", [{ path: "email", message: "Already registered." }]);
    }
    if (get("SELECT id FROM users WHERE LOWER(studentId) = LOWER(?)", input.studentId)) {
      throw conflict("This Student ID is already registered.", [{ path: "studentId", message: "Already registered." }]);
    }

    const ts = nowIso();
    const id = rowId("u");
    const department = input.department;

    transaction(() => {
      run(
        `INSERT INTO users (id, name, studentId, email, passwordHash, role, university, department, program,
                            semester, batch, phone, bio, avatar, cgpa, creditsCompleted, coursesCompleted,
                            attendance, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'student', 'Uttara University', ?, ?, ?, '', '', '', '', 0, 0, 0, 100, ?, ?)`,
        id,
        input.name,
        input.studentId,
        email,
        hashPassword(input.password),
        department,
        department ? `B.Sc. / Bachelor in ${department}` : "",
        input.semester,
        ts,
        ts
      );
      // New accounts start from the same showcase dataset as the localStorage demo.
      seedUserData(id);
    });

    const user = get("SELECT * FROM users WHERE id = ?", id);
    const session = createSession(id, req);
    purgeExpiredSessions();
    attachSession(res, session);
    res.status(201).json({ data: { user: publicUser(user), token: session.token, expiresAt: session.expiresAt } });
  }),
];

export const login = [
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(loginSchema, req.body ?? {});
    const email = input.email.toLowerCase();

    const user = get("SELECT * FROM users WHERE email = ?", email);
    const ok = user ? verifyPassword(input.password, user.passwordHash) : verifyPassword(input.password, DUMMY_HASH);

    if (!user || !ok) {
      throw unauthorized("Incorrect email or password.");
    }

    const session = createSession(user.id, req);
    purgeExpiredSessions();
    attachSession(res, session);

    res.json({ data: { user: publicUser(user), token: session.token, expiresAt: session.expiresAt } });
  }),
];

export const logout = asyncHandler(async (req, res) => {
  if (req.sessionId) run("DELETE FROM sessions WHERE id = ?", req.sessionId);
  res.json({ data: { ok: true } });
});

export const logoutAll = asyncHandler(async (req, res) => {
  run("DELETE FROM sessions WHERE userId = ?", req.user.id);
  res.json({ data: { ok: true } });
});

export const me = asyncHandler(async (req, res) => {
  const session = get("SELECT expiresAt FROM sessions WHERE id = ?", req.sessionId);
  res.json({ data: { user: publicUser(req.user), expiresAt: session?.expiresAt ?? null } });
});
