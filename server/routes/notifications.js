import { Router } from "express";
import { nowIso, run } from "../db/index.js";
import { asyncHandler } from "../lib/errors.js";
import { makeCollection } from "../lib/collection.js";
import { notificationSchema, parse, zSearch } from "../lib/validate.js";

const notifications = makeCollection({ table: "notifications", schema: notificationSchema, idPrefix: "nt", timestamps: false });

const serialize = ({ userId, ...rest }) => {
  void userId;
  return { ...rest, read: !!rest.read };
};

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = parse(zSearch, req.query.q);
    const clauses = [];
    const params = [];

    if (q) {
      clauses.push("(LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?))");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (req.query.unread === "true") clauses.push("read = 0");

    const rows = notifications.list(req.user.id, {
      where: clauses.join(" AND ") || "1=1",
      params,
      order: "time DESC",
    });

    res.json({ data: rows.map(serialize) });
  })
);

notificationsRouter.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    res.json({ data: { count: notifications.count(req.user.id, "read = 0") } });
  })
);

notificationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = parse(notificationSchema, req.body ?? {});
    const ts = input.time || nowIso();
    const created = notifications.create(req.user.id, {
      ...input,
      time: ts,
      createdAt: ts,
    });
    res.status(201).json({ data: serialize(created) });
  })
);

notificationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const read = req.body?.read;
    if (typeof read !== "boolean") {
      const updated = notifications.update(req.user.id, req.params.id, {});
      return res.json({ data: serialize(updated) });
    }
    res.json({ data: serialize(notifications.update(req.user.id, req.params.id, { read })) });
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    run("UPDATE notifications SET read = 1 WHERE userId = ?", req.user.id);
    res.json({ data: { ok: true } });
  })
);

notificationsRouter.delete(
  "/read",
  asyncHandler(async (req, res) => {
    run("DELETE FROM notifications WHERE userId = ? AND read = 1", req.user.id);
    res.json({ data: { ok: true } });
  })
);

notificationsRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    run("DELETE FROM notifications WHERE userId = ?", req.user.id);
    res.json({ data: { ok: true } });
  })
);

notificationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json({ data: notifications.remove(req.user.id, req.params.id) });
  })
);
