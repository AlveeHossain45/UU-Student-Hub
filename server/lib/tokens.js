import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const newId = () => randomUUID();

/** URL-safe opaque id used for row primary keys (short, sortable-ish, collision resistant). */
export const rowId = (prefix = "") => {
  const id = randomBytes(9).toString("base64url");
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Access tokens are JWTs carrying the session id, so they can be revoked
 * server-side by deleting the session row (logout / password change).
 */
export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ sub: userId, sid: sessionId }, config.jwt.secret, {
    algorithm: "HS256",
    expiresIn: config.jwt.expiresIn,
    issuer: "uu-student-hub",
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"], issuer: "uu-student-hub" });
  if (!payload?.sub || !payload?.sid) throw new Error("Malformed token payload");
  return payload;
}

export const newSessionToken = () => randomBytes(32).toString("hex");
