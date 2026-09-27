import { Router } from "express";
import { all, get } from "../db/index.js";
import { asyncHandler } from "../lib/errors.js";
import { getAssignmentStatus } from "../../src/utils/helpers.js";

/** Dashboard aggregates — the same numbers the SPA computes client-side. */
export const statsRouter = Router();

statsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const today = now.getDay();
    const todayInput = now.toISOString().slice(0, 10);

    const assignments = all("SELECT * FROM assignments WHERE userId = ?", userId);
    const statuses = assignments.map((a) => getAssignmentStatus(a, now));

    const exams = all("SELECT date FROM exams WHERE userId = ?", userId);
    const unreadNotices =
      get(
        `SELECT COUNT(*) AS n FROM notices n
         WHERE NOT EXISTS (SELECT 1 FROM noticeReads r WHERE r.noticeId = n.id AND r.userId = ? AND r.read = 1)`,
        userId
      )?.n ?? 0;

    res.json({
      data: {
        cgpa: req.user.cgpa,
        creditsCompleted: req.user.creditsCompleted,
        attendance: req.user.attendance,
        courses: get("SELECT COUNT(*) AS n FROM courses WHERE userId = ?", userId)?.n ?? 0,
        todayClasses:
          get("SELECT COUNT(*) AS n FROM routineClasses WHERE userId = ? AND day = ?", userId, today)?.n ?? 0,
        assignments: {
          total: assignments.length,
          pending: statuses.filter((s) => s === "pending").length,
          inProgress: statuses.filter((s) => s === "in-progress").length,
          completed: statuses.filter((s) => s === "completed").length,
          overdue: statuses.filter((s) => s === "overdue").length,
        },
        exams: {
          total: exams.length,
          upcoming: exams.filter((e) => e.date >= todayInput).length,
          past: exams.filter((e) => e.date < todayInput).length,
        },
        notices: {
          total: get("SELECT COUNT(*) AS n FROM notices")?.n ?? 0,
          unread: unreadNotices,
        },
        notifications: {
          total: get("SELECT COUNT(*) AS n FROM notifications WHERE userId = ?", userId)?.n ?? 0,
          unread: get("SELECT COUNT(*) AS n FROM notifications WHERE userId = ? AND read = 0", userId)?.n ?? 0,
        },
      },
    });
  })
);
