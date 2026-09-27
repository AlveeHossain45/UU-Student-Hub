import { get } from "../db/index.js";
import { unauthorized, forbidden } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

/** Bearer-token authentication with server-side session revocation. */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    if (!token) return next(unauthorized("Please sign in to continue."));

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(unauthorized("Your session has expired. Please sign in again."));
    }

    const session = get("SELECT id, userId, expiresAt FROM sessions WHERE id = ?", payload.sid);
    if (!session || session.userId !== payload.sub) return next(unauthorized("Your session is no longer valid."));
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return next(unauthorized("Your session has expired. Please sign in again."));
    }

    const user = get("SELECT * FROM users WHERE id = ?", payload.sub);
    if (!user) return next(unauthorized("Your account no longer exists."));

    req.user = user;
    req.sessionId = payload.sid;
    next();
  } catch (err) {
    next(err);
  }
}

/** Guard admin-only endpoints (notices publishing, etc.). */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return next(forbidden("Administrator access required."));
  next();
}
