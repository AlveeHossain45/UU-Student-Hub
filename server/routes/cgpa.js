import { Router } from "express";
import { all, run } from "../db/index.js";
import { asyncHandler } from "../lib/errors.js";
import { makeCollection } from "../lib/collection.js";
import { cgpaCourseSchema, parse } from "../lib/validate.js";
import { rowId } from "../lib/tokens.js";
import { z } from "zod";

const cgpaCourses = makeCollection({ table: "cgpaCourses", schema: cgpaCourseSchema, idPrefix: "g" });

const historySchema = z
  .array(
    z.object({
      label: z.string().trim().min(1, "Semester label is required.").max(20),
      gpa: z.coerce.number().min(0, "GPA cannot be negative.").max(4, "GPA cannot exceed 4.00."),
    })
  )
  .max(30, "A maximum of 30 semesters is supported.");

export const cgpaRouter = Router();

cgpaRouter.get(
  "/courses",
  asyncHandler(async (req, res) => {
    res.json({ data: cgpaCourses.list(req.user.id, { order: "position ASC, rowid ASC" }) });
  })
);

cgpaRouter.post(
  "/courses",
  asyncHandler(async (req, res) => {
    const input = parse(cgpaCourseSchema, req.body ?? {});
    const next = (all("SELECT MAX(position) AS p FROM cgpaCourses WHERE userId = ?", req.user.id)[0]?.p ?? -1) + 1;
    res.status(201).json({ data: cgpaCourses.create(req.user.id, { ...input, position: next }) });
  })
);

cgpaRouter.put(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const input = parse(cgpaCourseSchema.partial(), req.body ?? {});
    res.json({ data: cgpaCourses.update(req.user.id, req.params.id, input) });
  })
);

cgpaRouter.delete(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    res.json({ data: cgpaCourses.remove(req.user.id, req.params.id) });
  })
);

cgpaRouter.delete(
  "/courses",
  asyncHandler(async (req, res) => {
    run("DELETE FROM cgpaCourses WHERE userId = ?", req.user.id);
    res.json({ data: { ok: true } });
  })
);

cgpaRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    res.json({ data: all("SELECT id, label, gpa FROM cgpaHistory WHERE userId = ? ORDER BY position ASC, rowid ASC", req.user.id) });
  })
);

cgpaRouter.put(
  "/history",
  asyncHandler(async (req, res) => {
    const rows = parse(historySchema, Array.isArray(req.body) ? req.body : []);
    run("DELETE FROM cgpaHistory WHERE userId = ?", req.user.id);
    rows.forEach((item, index) => {
      run(
        "INSERT INTO cgpaHistory (id, userId, label, gpa, position) VALUES (?, ?, ?, ?, ?)",
        rowId("gh"),
        req.user.id,
        item.label,
        item.gpa,
        index
      );
    });
    res.json({ data: all("SELECT id, label, gpa FROM cgpaHistory WHERE userId = ? ORDER BY position ASC", req.user.id) });
  })
);
