import {
  DEMO_USER,
  GPA_HISTORY,
  initialAssignments,
  initialCgpaCourses,
  initialCourses,
  initialExams,
  initialNotifications,
  initialNotices,
  initialRoutine,
  initialSettings,
} from "../../src/data/mockData.js";
import { hashPassword } from "../lib/passwords.js";
import { rowId } from "../lib/tokens.js";
import { all, get, nowIso, run, transaction } from "./index.js";

/**
 * Demo rows are imported from the frontend's own mockData module so the API
 * and the localStorage demo always describe the same student.
 * Row ids are generated per user (they are globally unique primary keys).
 */

function insertNotices() {
  if (get("SELECT id FROM notices LIMIT 1")) return;
  const ts = nowIso();
  initialNotices.forEach((n) => {
    run(
      `INSERT INTO notices (id, title, description, date, category, pinned, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      n.id,
      n.title,
      n.description,
      n.date,
      n.category,
      n.pinned ? 1 : 0,
      ts,
      ts
    );
  });
}

function insertNoticeReads(userId) {
  initialNotices.forEach((n) => {
    run(`INSERT OR REPLACE INTO noticeReads (noticeId, userId, read) VALUES (?, ?, ?)`, n.id, userId, n.read ? 1 : 0);
  });
}

/** Seed (or re-seed) the showcase dataset for one user. Safe to call repeatedly. */
export function seedUserData(userId) {
  const ts = nowIso();

  transaction(() => {
    for (const table of ["courses", "routineClasses", "assignments", "exams", "notifications", "cgpaCourses", "cgpaHistory"]) {
      run(`DELETE FROM ${table} WHERE userId = ?`, userId);
    }
    run("DELETE FROM settings WHERE userId = ?", userId);
    run("DELETE FROM noticeReads WHERE userId = ?", userId);

    for (const c of initialCourses) {
      run(
        `INSERT INTO courses (id, userId, code, name, credits, instructor, progress, color, description, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("c"), userId, c.code, c.name, c.credits, c.instructor, c.progress, c.color, c.description, ts, ts
      );
    }

    for (const r of initialRoutine) {
      run(
        `INSERT INTO routineClasses (id, userId, day, courseCode, courseName, teacher, room, start, end, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("r"), userId, r.day, r.courseCode, r.courseName, r.teacher, r.room, r.start, r.end, ts, ts
      );
    }

    for (const a of initialAssignments) {
      run(
        `INSERT INTO assignments (id, userId, course, title, description, deadline, priority, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("a"), userId, a.course, a.title, a.description, a.deadline, a.priority, a.status, ts, ts
      );
    }

    for (const e of initialExams) {
      run(
        `INSERT INTO exams (id, userId, course, title, type, date, time, room, syllabus, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("e"), userId, e.course, e.title, e.type, e.date, e.time, e.room, e.syllabus, ts, ts
      );
    }

    for (const nt of initialNotifications) {
      run(
        `INSERT INTO notifications (id, userId, type, title, message, time, read, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("nt"), userId, nt.type, nt.title, nt.message, nt.time, nt.read ? 1 : 0, ts
      );
    }

    run(`INSERT INTO settings (userId, value, updatedAt) VALUES (?, ?, ?)`, userId, JSON.stringify(initialSettings), ts);

    initialCgpaCourses.forEach((c, i) => {
      run(
        `INSERT INTO cgpaCourses (id, userId, code, name, credit, grade, position, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        rowId("g"), userId, c.code, c.name, c.credit, c.grade, i, ts
      );
    });

    GPA_HISTORY.forEach((g, i) => {
      run(`INSERT INTO cgpaHistory (id, userId, label, gpa, position) VALUES (?, ?, ?, ?, ?)`, rowId("gh"), userId, g.label, g.gpa, i);
    });

    insertNotices();
    insertNoticeReads(userId);
  });
}

/** First boot: create the demo student and, if needed, the global notice board. */
export function seedIfEmpty() {
  insertNotices();

  if (get("SELECT id FROM users LIMIT 1")) return false;

  const ts = nowIso();
  const { password, ...profile } = DEMO_USER;

  transaction(() => {
    run(
      `INSERT INTO users (id, name, studentId, email, passwordHash, role, university, department, program,
                          semester, batch, phone, bio, avatar, cgpa, creditsCompleted, coursesCompleted,
                          attendance, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      profile.id,
      profile.name,
      profile.studentId,
      profile.email.toLowerCase(),
      hashPassword(password),
      profile.university,
      profile.department,
      profile.program,
      profile.semester,
      profile.batch,
      profile.phone,
      profile.bio,
      profile.avatar,
      profile.cgpa,
      profile.creditsCompleted,
      profile.coursesCompleted,
      profile.attendance,
      ts,
      ts
    );
    seedUserData(profile.id);
  });

  return true;
}

export function dbStats() {
  const count = (table) => all(`SELECT COUNT(*) AS n FROM ${table}`)[0]?.n ?? 0;
  return {
    users: count("users"),
    courses: count("courses"),
    notices: count("notices"),
    sessions: count("sessions"),
  };
}
