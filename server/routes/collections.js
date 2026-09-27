import { Router } from "express";
import { makeCollection } from "../lib/collection.js";
import { asyncHandler, conflict } from "../lib/errors.js";
import {
  assignmentSchema,
  classObject,
  classSchema,
  courseSchema,
  examSchema,
  parse,
  zAssignmentStatus,
  zPriority,
  zSearch,
} from "../lib/validate.js";
import { getAssignmentStatus } from "../../src/utils/helpers.js";

/* ---------- repositories ---------- */

export const courses = makeCollection({ table: "courses", schema: courseSchema, idPrefix: "c" });
export const routine = makeCollection({ table: "routineClasses", schema: classObject, idPrefix: "r" });
export const assignments = makeCollection({ table: "assignments", schema: assignmentSchema, idPrefix: "a" });
export const exams = makeCollection({ table: "exams", schema: examSchema, idPrefix: "e" });

/* ---------- helpers ---------- */

/** Build a case-insensitive OR-matched WHERE clause with matching placeholders. */
function searchClause(fields, term) {
  if (!term) return null;
  const like = `%${term}%`;
  return {
    where: `(${fields.map((f) => `LOWER(${f}) LIKE LOWER(?)`).join(" OR ")})`,
    params: fields.map(() => like),
  };
}

const pickSort = (table, key, fallback) => (Object.hasOwn(table, key) ? table[key] : fallback);

/**
 * Mounts the standard REST verbs for a user-owned collection.
 * `beforeCreate` / `beforeUpdate` add per-collection business rules.
 */
function mountCrud(router, { repo, schema, createSchema = schema, beforeCreate, beforeUpdate, list }) {
  const patchSchema = schema.partial();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json({ data: list ? await list(req) : repo.list(req.user.id) });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json({ data: repo.get(req.user.id, req.params.id) });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = parse(createSchema, req.body ?? {});
      if (beforeCreate) await beforeCreate(req, input);
      res.status(201).json({ data: repo.create(req.user.id, input) });
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const input = parse(patchSchema, req.body ?? {});
      if (beforeUpdate) await beforeUpdate(req, input);
      res.json({ data: repo.update(req.user.id, req.params.id, input) });
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const input = parse(patchSchema, req.body ?? {});
      if (beforeUpdate) await beforeUpdate(req, input);
      res.json({ data: repo.update(req.user.id, req.params.id, input) });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json({ data: repo.remove(req.user.id, req.params.id) });
    })
  );

  return router;
}

/* ---------- courses ---------- */

export const coursesRouter = mountCrud(Router(), {
  repo: courses,
  schema: courseSchema,
  beforeCreate: (req, input) => {
    if (courses.findOne(req.user.id, "LOWER(code) = LOWER(?)", input.code)) {
      throw conflict("A course with this code already exists.", [{ path: "code", message: "Already added." }]);
    }
  },
  beforeUpdate: (req, input) => {
    if (input.code && courses.findOne(req.user.id, "LOWER(code) = LOWER(?) AND id != ?", input.code, req.params.id)) {
      throw conflict("A course with this code already exists.", [{ path: "code", message: "Already added." }]);
    }
  },
  list: (req) => {
    const q = parse(zSearch, req.query.q);
    const search = searchClause(["code", "name", "instructor", "description"], q);
    return courses.list(req.user.id, search ? { where: search.where, params: search.params } : {});
  },
});

/* ---------- routine ---------- */

export const routineRouter = mountCrud(Router(), {
  repo: routine,
  schema: classObject,
  createSchema: classSchema,
  list: (req) => {
    if (req.query.day !== undefined && req.query.day !== "") {
      const day = parse(classObject.shape.day, req.query.day);
      return routine.list(req.user.id, { where: "day = ?", params: [day], order: "start ASC" });
    }
    return routine.list(req.user.id, { order: "day ASC, start ASC" });
  },
});

/* ---------- assignments ---------- */

const assignmentSorts = {
  deadline: "deadline ASC",
  "-deadline": "deadline DESC",
  // NOCASE mirrors the SPA's localeCompare so both modes order titles identically.
  title: "title COLLATE NOCASE ASC",
  priority: "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, deadline ASC",
  created: "createdAt DESC",
};

export const assignmentsRouter = mountCrud(Router(), {
  repo: assignments,
  schema: assignmentSchema,
  list: (req) => {
    const q = parse(zSearch, req.query.q);
    const status = req.query.status ? parse(zAssignmentStatus, req.query.status) : null;
    const priority = req.query.priority ? parse(zPriority, req.query.priority) : null;
    const course = typeof req.query.course === "string" && req.query.course.trim() ? req.query.course.trim() : null;
    const order = pickSort(assignmentSorts, String(req.query.sort ?? ""), assignmentSorts.deadline);

    const clauses = [];
    const params = [];

    const search = searchClause(["title", "course", "description"], q);
    if (search) {
      clauses.push(search.where);
      params.push(...search.params);
    }
    if (priority) {
      clauses.push("priority = ?");
      params.push(priority);
    }
    if (course) {
      clauses.push("LOWER(course) = LOWER(?)");
      params.push(course);
    }

    const rows = assignments.list(req.user.id, {
      where: clauses.join(" AND ") || "1=1",
      params,
      order,
    });

    // `overdue` is derived at read time (mirrors the frontend helper).
    const now = new Date();
    const withStatus = rows.map((row) => ({ ...row, status: getAssignmentStatus(row, now) }));
    return status ? withStatus.filter((row) => row.status === status) : withStatus;
  },
});

/* ---------- exams ---------- */

const examSorts = {
  date: "date ASC, time ASC",
  "-date": "date DESC, time ASC",
  title: "title COLLATE NOCASE ASC",
};

export const examsRouter = mountCrud(Router(), {
  repo: exams,
  schema: examSchema,
  list: (req) => {
    const q = parse(zSearch, req.query.q);
    const today = new Date().toISOString().slice(0, 10);

    const clauses = [];
    const params = [];

    const search = searchClause(["title", "course", "room", "type", "syllabus"], q);
    if (search) {
      clauses.push(search.where);
      params.push(...search.params);
    }
    if (req.query.upcoming === "true") {
      clauses.push("date >= ?");
      params.push(today);
    }

    return exams.list(req.user.id, {
      where: clauses.join(" AND ") || "1=1",
      params,
      order: pickSort(examSorts, String(req.query.sort ?? ""), examSorts.date),
    });
  },
});
