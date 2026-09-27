import { get, nowIso, run, transaction } from "../db/index.js";
import { asyncHandler, badRequest, conflict } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { parse, passwordChangeSchema, profileSchema } from "../lib/validate.js";
import { seedUserData } from "../db/seed.js";
import { publicUser } from "./auth.js";

const OWNED_TABLES = [
  "courses",
  "routineClasses",
  "assignments",
  "exams",
  "notifications",
  "cgpaCourses",
  "cgpaHistory",
  "chatMessages",
  "noticeReads",
  "sessions",
];

export const updateProfile = asyncHandler(async (req, res) => {
  const patch = parse(profileSchema, req.body ?? {});
  const keys = Object.keys(patch);
  if (keys.length === 0) throw badRequest("Nothing to update.");

  if (patch.studentId && patch.studentId !== req.user.studentId) {
    const taken = get("SELECT id FROM users WHERE LOWER(studentId) = LOWER(?) AND id != ?", patch.studentId, req.user.id);
    if (taken) throw conflict("This Student ID belongs to another account.", [{ path: "studentId", message: "Already in use." }]);
  }
  if (patch.email) delete patch.email; // email changes are not part of this API

  const values = { ...patch, updatedAt: nowIso() };
  const columns = Object.keys(values);
  run(`UPDATE users SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, ...columns.map((c) => values[c]), req.user.id);

  res.json({ data: { user: publicUser(get("SELECT * FROM users WHERE id = ?", req.user.id)) } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const input = parse(passwordChangeSchema, req.body ?? {});
  if (input.current === input.next) throw badRequest("The new password must be different from the current one.");

  if (!verifyPassword(input.current, req.user.passwordHash)) {
    throw badRequest("Your current password is incorrect.", [{ path: "current", message: "Incorrect password." }]);
  }

  run("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?", hashPassword(input.next), nowIso(), req.user.id);
  // Changing a password signs out every other device.
  run("DELETE FROM sessions WHERE userId = ? AND id != ?", req.user.id, req.sessionId);

  res.json({ data: { ok: true } });
});

/** Restore the showcase dataset for this account (Settings → "Reset demo data"). */
export const resetData = asyncHandler(async (req, res) => {
  seedUserData(req.user.id);
  res.json({ data: { ok: true } });
});

/** Permanently delete the account and everything it owns. */
export const deleteAccount = asyncHandler(async (req, res) => {
  transaction(() => {
    OWNED_TABLES.forEach((table) => run(`DELETE FROM ${table} WHERE userId = ?`, req.user.id));
    run("DELETE FROM settings WHERE userId = ?", req.user.id);
    run("DELETE FROM users WHERE id = ?", req.user.id);
  });
  res.json({ data: { ok: true } });
});
