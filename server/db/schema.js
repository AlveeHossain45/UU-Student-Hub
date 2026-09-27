/**
 * SQLite schema.
 *
 * Column names intentionally match the JSON shape used by the React app
 * (camelCase) so rows can be returned to clients without a mapping layer,
 * which removes a whole class of rename bugs. Only `userId` / `passwordHash`
 * and other server-owned columns are stripped before responding.
 *
 * Every user-owned table is scoped by `userId` and cascades on user delete.
 * Notices are institution-wide; per-user read state lives in `noticeReads`.
 */
export const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  studentId        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  passwordHash     TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'student',
  university       TEXT NOT NULL DEFAULT 'Uttara University',
  department       TEXT NOT NULL DEFAULT '',
  program          TEXT NOT NULL DEFAULT '',
  semester         TEXT NOT NULL DEFAULT '',
  batch            TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  bio              TEXT NOT NULL DEFAULT '',
  avatar           TEXT NOT NULL DEFAULT '',
  cgpa             REAL NOT NULL DEFAULT 0,
  creditsCompleted INTEGER NOT NULL DEFAULT 0,
  coursesCompleted INTEGER NOT NULL DEFAULT 0,
  attendance       INTEGER NOT NULL DEFAULT 100,
  createdAt        TEXT NOT NULL,
  updatedAt        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt  TEXT NOT NULL,
  expiresAt  TEXT NOT NULL,
  userAgent  TEXT,
  ip         TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  credits     REAL NOT NULL DEFAULT 3,
  instructor  TEXT NOT NULL DEFAULT '',
  progress    INTEGER NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT 'blue',
  description TEXT NOT NULL DEFAULT '',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL,
  UNIQUE (userId, code)
);

CREATE TABLE IF NOT EXISTS routineClasses (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         INTEGER NOT NULL,
  courseCode  TEXT NOT NULL,
  courseName  TEXT NOT NULL,
  teacher     TEXT NOT NULL DEFAULT '',
  room        TEXT NOT NULL DEFAULT '',
  start       TEXT NOT NULL,
  end         TEXT NOT NULL,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course      TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deadline    TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'medium',
  status      TEXT NOT NULL DEFAULT 'pending',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course      TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'Midterm',
  date        TEXT NOT NULL,
  time        TEXT NOT NULL DEFAULT '10:00',
  room        TEXT NOT NULL DEFAULT '',
  syllabus    TEXT NOT NULL DEFAULT '',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notices (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  pinned      INTEGER NOT NULL DEFAULT 0,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS noticeReads (
  noticeId TEXT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  userId   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (noticeId, userId)
);

CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type      TEXT NOT NULL DEFAULT 'info',
  title     TEXT NOT NULL,
  message   TEXT NOT NULL DEFAULT '',
  time      TEXT NOT NULL,
  read      INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  userId    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  value     TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cgpaCourses (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code      TEXT NOT NULL,
  name      TEXT NOT NULL,
  credit    REAL NOT NULL DEFAULT 0,
  grade     TEXT NOT NULL DEFAULT '',
  position  INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cgpaHistory (
  id       TEXT PRIMARY KEY,
  userId   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  gpa      REAL NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chatMessages (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL,
  content   TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user        ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_expires     ON sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_courses_user         ON courses(userId);
CREATE INDEX IF NOT EXISTS idx_routine_user_day     ON routineClasses(userId, day);
CREATE INDEX IF NOT EXISTS idx_assignments_user     ON assignments(userId, deadline);
CREATE INDEX IF NOT EXISTS idx_exams_user_date      ON exams(userId, date);
CREATE INDEX IF NOT EXISTS idx_notices_date         ON notices(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(userId, time);
CREATE INDEX IF NOT EXISTS idx_cgpa_courses_user    ON cgpaCourses(userId, position);
CREATE INDEX IF NOT EXISTS idx_chat_user            ON chatMessages(userId, createdAt);
`;
