import { Router } from "express";
import { all, get } from "../db/index.js";
import { asyncHandler } from "../lib/errors.js";
import { parse, zSearch } from "../lib/validate.js";

const like = (term) => `%${term}%`;
const match = (fields, term) => `(${fields.map((f) => `LOWER(${f}) LIKE LOWER(?)`).join(" OR ")})`;
const paramsFor = (fields, term) => fields.map(() => like(term));

/** Global search across everything a student owns, plus the notice board. */
export const searchRouter = Router();

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = parse(zSearch, req.query.q);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 5, 20);

    if (!q) {
      return res.json({ data: { courses: [], assignments: [], exams: [], notices: [], routine: [] } });
    }

    const courses = all(
      `SELECT id, code, name, instructor FROM courses WHERE userId = ? AND ${match(["code", "name", "instructor"], q)} LIMIT ?`,
      req.user.id,
      ...paramsFor(["code", "name", "instructor"], q),
      limit
    );

    const assignments = all(
      `SELECT id, title, course, deadline, status FROM assignments WHERE userId = ? AND ${match(["title", "course", "description"], q)} ORDER BY deadline ASC LIMIT ?`,
      req.user.id,
      ...paramsFor(["title", "course", "description"], q),
      limit
    );

    const exams = all(
      `SELECT id, title, course, type, date, time, room FROM exams WHERE userId = ? AND ${match(["title", "course", "type", "room"], q)} ORDER BY date ASC LIMIT ?`,
      req.user.id,
      ...paramsFor(["title", "course", "type", "room"], q),
      limit
    );

    const routine = all(
      `SELECT id, day, courseCode, courseName, teacher, room, start, end FROM routineClasses
       WHERE userId = ? AND ${match(["courseCode", "courseName", "teacher", "room"], q)} ORDER BY day ASC, start ASC LIMIT ?`,
      req.user.id,
      ...paramsFor(["courseCode", "courseName", "teacher", "room"], q),
      limit
    );

    const notices = all(
      `SELECT id, title, category, date FROM notices WHERE ${match(["title", "description", "category"], q)}
       ORDER BY pinned DESC, date DESC LIMIT ?`,
      ...paramsFor(["title", "description", "category"], q),
      limit
    ).map((row) => {
      const read = get("SELECT read FROM noticeReads WHERE noticeId = ? AND userId = ?", row.id, req.user.id);
      return { ...row, read: read ? !!read.read : false };
    });

    res.json({ data: { courses, assignments, exams, routine, notices } });
  })
);
