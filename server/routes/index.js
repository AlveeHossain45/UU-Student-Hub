import { Router } from "express";
import { config } from "../config.js";
import { dbStats } from "../db/seed.js";
import { asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { login, logout, logoutAll, me, register } from "./auth.js";
import { assignmentsRouter, coursesRouter, examsRouter, routineRouter } from "./collections.js";
import { changePassword, deleteAccount, resetData, updateProfile } from "./users.js";
import { noticesRouter } from "./notices.js";
import { notificationsRouter } from "./notifications.js";
import { settingsRouter } from "./settings.js";
import { cgpaRouter } from "./cgpa.js";
import { searchRouter } from "./search.js";
import { statsRouter } from "./stats.js";
import { chatRouter } from "./chat.js";

/** All API routes. Public auth endpoints first, then everything behind requireAuth. */
export function createApiRouter() {
  const api = Router();

  api.get(
    "/health",
    asyncHandler(async (req, res) => {
      res.json({
        data: {
          status: "ok",
          env: config.env,
          time: new Date().toISOString(),
          uptime: Math.round(process.uptime()),
          aiProvider: config.ai.provider,
          seeded: dbStats(),
        },
      });
    })
  );

  /* ---------- public ---------- */
  api.post("/auth/register", register);
  api.post("/auth/login", login);

  /* ---------- authenticated ---------- */
  api.use(requireAuth);

  api.get("/auth/me", me);
  api.post("/auth/logout", logout);
  api.post("/auth/logout-all", logoutAll);

  api.put("/users/me", updateProfile);
  api.post("/users/me/password", authLimiter, changePassword);
  api.post("/users/me/reset", resetData);
  api.delete("/users/me", deleteAccount);

  api.use("/courses", coursesRouter);
  api.use("/routine", routineRouter);
  api.use("/assignments", assignmentsRouter);
  api.use("/exams", examsRouter);
  api.use("/notices", noticesRouter);
  api.use("/notifications", notificationsRouter);
  api.use("/settings", settingsRouter);
  api.use("/cgpa", cgpaRouter);
  api.use("/search", searchRouter);
  api.use("/stats", statsRouter);
  api.use("/chat", chatRouter);

  return api;
}
