import { Router } from "express";
import { all, get, nowIso, run } from "../db/index.js";
import { asyncHandler, notFound } from "../lib/errors.js";
import { parse, noticeSchema, zNoticeCategory, zSearch } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { rowId } from "../lib/tokens.js";

/**
 * Notices are institution-wide; each student has their own read state in
 * `noticeReads`. The response shape matches the frontend's notice objects
 * (including the `read` flag) so the UI needs no adaptation.
 */
function serializeNotice(userId, row) {
  const read = get("SELECT read FROM noticeReads WHERE noticeId = ? AND userId = ?", row.id, userId);
  const { userId: _u, ...rest } = row;
  void _u;
  return { ...rest, pinned: !!row.pinned, read: read ? !!read.read : false };
}

export const noticesRouter = Router();

noticesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = parse(zSearch, req.query.q);
    const category = req.query.category && req.query.category !== "All" ? parse(zNoticeCategory, req.query.category) : null;
    const unread = req.query.unread === "true";

    const clauses = [];
    const params = [];
    if (q) {
      clauses.push("(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (category) {
      clauses.push("category = ?");
      params.push(category);
    }

    let rows = all(
      `SELECT * FROM notices WHERE ${clauses.join(" AND ") || "1=1"} ORDER BY pinned DESC, date DESC, createdAt DESC`,
      ...params
    ).map((row) => serializeNotice(req.user.id, row));

    if (unread) rows = rows.filter((n) => !n.read);

    res.json({ data: rows });
  })
);

noticesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = get("SELECT * FROM notices WHERE id = ?", req.params.id);
    if (!row) throw notFound("That notice no longer exists.");
    res.json({ data: serializeNotice(req.user.id, row) });
  })
);

noticesRouter.put(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const row = get("SELECT id FROM notices WHERE id = ?", req.params.id);
    if (!row) throw notFound("That notice no longer exists.");
    const read = req.body?.read === undefined ? true : !!req.body.read;
    run("INSERT OR REPLACE INTO noticeReads (noticeId, userId, read) VALUES (?, ?, ?)", row.id, req.user.id, read ? 1 : 0);
    res.json({ data: { id: row.id, read } });
  })
);

noticesRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const ids = all("SELECT id FROM notices").map((r) => r.id);
    ids.forEach((id) => run("INSERT OR REPLACE INTO noticeReads (noticeId, userId, read) VALUES (?, ?, 1)", id, req.user.id));
    res.json({ data: { updated: ids.length } });
  })
);

/* Publishing is admin-only — the notice board is shared by every student. */

noticesRouter.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = parse(noticeSchema, req.body ?? {});
    const ts = nowIso();
    const id = rowId("n");
    run(
      `INSERT INTO notices (id, title, description, date, category, pinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.title,
      input.description,
      input.date,
      input.category,
      input.pinned ? 1 : 0,
      ts,
      ts
    );
    res.status(201).json({ data: serializeNotice(req.user.id, get("SELECT * FROM notices WHERE id = ?", id)) });
  })
);

noticesRouter.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = get("SELECT * FROM notices WHERE id = ?", req.params.id);
    if (!existing) throw notFound("That notice no longer exists.");
    const input = parse(noticeSchema.partial(), req.body ?? {});
    const values = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      date: input.date ?? existing.date,
      category: input.category ?? existing.category,
      pinned: (input.pinned ?? !!existing.pinned) ? 1 : 0,
      updatedAt: nowIso(),
    };
    run(
      "UPDATE notices SET title = ?, description = ?, date = ?, category = ?, pinned = ?, updatedAt = ? WHERE id = ?",
      values.title,
      values.description,
      values.date,
      values.category,
      values.pinned,
      values.updatedAt,
      existing.id
    );
    res.json({ data: serializeNotice(req.user.id, get("SELECT * FROM notices WHERE id = ?", existing.id)) });
  })
);

noticesRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    run("DELETE FROM notices WHERE id = ?", req.params.id);
    res.json({ data: { id: req.params.id } });
  })
);
