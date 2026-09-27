import { Router } from "express";
import { get, nowIso, run } from "../db/index.js";
import { asyncHandler } from "../lib/errors.js";
import { parse, settingsSchema } from "../lib/validate.js";
import { initialSettings } from "../../src/data/mockData.js";

export const settingsRouter = Router();

function readSettings(userId) {
  const row = get("SELECT value FROM settings WHERE userId = ?", userId);
  if (!row) return { ...initialSettings };
  try {
    return { ...initialSettings, ...JSON.parse(row.value) };
  } catch {
    return { ...initialSettings };
  }
}

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ data: readSettings(req.user.id) });
  })
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const patch = parse(settingsSchema, req.body ?? {});
    const merged = { ...readSettings(req.user.id), ...patch };
    const value = JSON.stringify(merged);
    const existing = get("SELECT userId FROM settings WHERE userId = ?", req.user.id);

    if (existing) {
      run("UPDATE settings SET value = ?, updatedAt = ? WHERE userId = ?", value, nowIso(), req.user.id);
    } else {
      run("INSERT INTO settings (userId, value, updatedAt) VALUES (?, ?, ?)", req.user.id, value, nowIso());
    }

    res.json({ data: merged });
  })
);

settingsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const patch = parse(settingsSchema, req.body ?? {});
    const merged = { ...readSettings(req.user.id), ...patch };
    const value = JSON.stringify(merged);
    const existing = get("SELECT userId FROM settings WHERE userId = ?", req.user.id);

    if (existing) {
      run("UPDATE settings SET value = ?, updatedAt = ? WHERE userId = ?", value, nowIso(), req.user.id);
    } else {
      run("INSERT INTO settings (userId, value, updatedAt) VALUES (?, ?, ?)", req.user.id, value, nowIso());
    }

    res.json({ data: merged });
  })
);
