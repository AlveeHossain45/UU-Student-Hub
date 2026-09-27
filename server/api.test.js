import test, { after, before } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = ":memory:";
process.env.LOG_LEVEL = "silent";
process.env.SEED_DEMO_DATA = "true";

const { getDb, closeDb } = await import("./db/index.js");
const { seedIfEmpty } = await import("./db/seed.js");
const { createApp } = await import("./app.js");

const DEMO = { email: "alvee@uttarauniversity.edu.bd", password: "demo1234" };

let server;
let base;
let token;
let studentIdCounter = 0;
const otherAccount = { email: "", password: "secret123" };

before(async () => {
  getDb();
  seedIfEmpty();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  token = await loginAs();
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
});

/** Minimal HTTP helper returning { status, body }. */
async function api(path, { method = "GET", body, token: bearer } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { status: res.status, body: parsed };
}

async function loginAs(email = DEMO.email, password = DEMO.password) {
  const res = await api("/auth/login", { method: "POST", body: { email, password } });
  assert.equal(res.status, 200, `login failed: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

/* ───────────────────────── health & auth ───────────────────────── */
test("health endpoint reports a live server", async () => {
  const res = await api("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "ok");
  assert.ok(res.body.data.seeded.users >= 1);
});

test("protected routes reject missing tokens", async () => {
  const res = await api("/courses");
  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
  assert.ok(res.body.error);
});

test("login rejects bad credentials with a generic message", async () => {
  const unknown = await api("/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "x" } });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.error, "Incorrect email or password.");

  const wrong = await api("/auth/login", { method: "POST", body: { email: DEMO.email, password: "nope" } });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error, "Incorrect email or password.");
});

test("login is case-insensitive on email and never returns the password hash", async () => {
  const res = await api("/auth/login", { method: "POST", body: { email: DEMO.email.toUpperCase(), password: DEMO.password } });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.token.length > 50);
  assert.equal(res.body.data.user.passwordHash, undefined);
  assert.equal(res.body.data.user.studentId, "UU-CSE-2023-001");
});

test("registration validates input and enforces unique email / student id", async () => {
  const invalid = await api("/auth/register", {
    method: "POST",
    body: { name: "X", studentId: "UU-1", email: "not-an-email", password: "123" },
  });
  assert.equal(invalid.status, 400);
  assert.ok(Array.isArray(invalid.body.details));
  assert.ok(invalid.body.details.length >= 2);

  const dupEmail = await api("/auth/register", {
    method: "POST",
    body: { name: "Alvee", studentId: "UU-OTHER-1", email: DEMO.email, password: "demo1234" },
  });
  assert.equal(dupEmail.status, 409);
});

test("new accounts are seeded with the showcase dataset", async () => {
  const studentId = `UU-CSE-TEST-${++studentIdCounter}`;
  otherAccount.email = `t${studentIdCounter}@uttarauniversity.edu.bd`;
  const res = await api("/auth/register", {
    method: "POST",
    body: {
      name: "Test Student",
      studentId,
      email: otherAccount.email,
      password: otherAccount.password,
      department: "Computer Science & Engineering",
      semester: "1st Semester",
    },
  });
  assert.equal(res.status, 201);

  const otherToken = res.body.data.token;
  const courses = await api("/courses", { token: otherToken });
  assert.equal(courses.body.data.length, 7);
});

/* ───────────────────────── courses ───────────────────────── */

test("courses support full CRUD with duplicate-code protection", async () => {
  const list = await api("/courses", { token });
  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 7);
  assert.equal(list.body.data[0].userId, undefined, "userId must not leak to clients");

  const created = await api("/courses", {
    method: "POST",
    token,
    body: { code: "CSE 999", name: "Integration Test", credits: 3, instructor: "Dr. Test", progress: 10, color: "teal" },
  });
  assert.equal(created.status, 201);
  const id = created.body.data.id;

  const duplicate = await api("/courses", {
    method: "POST",
    token,
    body: { code: "cse 999", name: "Duplicate", credits: 3, instructor: "X" },
  });
  assert.equal(duplicate.status, 409);

  const patched = await api(`/courses/${id}`, { method: "PATCH", token, body: { progress: 55 } });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.data.progress, 55);
  assert.equal(patched.body.data.code, "CSE 999", "partial updates must not clear other fields");

  const search = await api("/courses?q=integration", { token });
  assert.equal(search.body.data.length, 1);

  const missing = await api("/courses/nope", { token });
  assert.equal(missing.status, 404);

  const deleted = await api(`/courses/${id}`, { method: "DELETE", token });
  assert.equal(deleted.status, 200);
  const again = await api(`/courses/${id}`, { method: "DELETE", token });
  assert.equal(again.status, 404);
});

/* ───────────────────────── routine & assignments ───────────────────────── */

test("routine validates day range and time ordering", async () => {
  const badDay = await api("/routine", {
    method: "POST",
    token,
    body: { day: 9, courseCode: "CSE 1", courseName: "X", teacher: "T", room: "R", start: "09:00", end: "10:00" },
  });
  assert.equal(badDay.status, 400);

  const badTime = await api("/routine", {
    method: "POST",
    token,
    body: { day: 1, courseCode: "CSE 1", courseName: "X", teacher: "T", room: "R", start: "12:00", end: "11:00" },
  });
  assert.equal(badTime.status, 400);
  assert.equal(badTime.body.details[0].path, "end");

  const created = await api("/routine", {
    method: "POST",
    token,
    body: { day: 3, courseCode: "CSE 1", courseName: "X", teacher: "T", room: "R", start: "09:00", end: "10:30" },
  });
  assert.equal(created.status, 201);

  const byDay = await api("/routine?day=3", { token });
  assert.ok(byDay.body.data.every((c) => c.day === 3));

  await api(`/routine/${created.body.data.id}`, { method: "DELETE", token });
});

test("assignments filter, search and sort server-side", async () => {
  const all = await api("/assignments", { token });
  assert.equal(all.body.data.length, 7);

  const overdue = await api("/assignments?status=overdue", { token });
  assert.ok(overdue.body.data.length >= 1);
  assert.ok(overdue.body.data.every((a) => a.status === "overdue"));

  const high = await api("/assignments?priority=high", { token });
  assert.ok(high.body.data.every((a) => a.priority === "high"));

  const search = await api("/assignments?q=AVL", { token });
  assert.equal(search.body.data.length, 1);

  const sorted = await api("/assignments?sort=title", { token });
  const titles = sorted.body.data.map((a) => a.title);
  const expected = [...titles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  assert.deepEqual(titles, expected);

  // An unknown sort key must fall back instead of reaching SQL.
  const injection = await api("/assignments?sort=title;DROP TABLE users", { token });
  assert.equal(injection.status, 200);
  const stillAlive = await api("/auth/me", { token });
  assert.equal(stillAlive.status, 200);
});

/* ───────────────────────── notices, notifications, settings ───────────────────────── */

test("notices are shared but read state is per user", async () => {
  const list = await api("/notices", { token });
  assert.equal(list.body.data.length, 10);
  assert.equal(typeof list.body.data[0].read, "boolean");

  const unread = list.body.data.find((n) => !n.read);
  assert.ok(unread, "seed should contain an unread notice");

  const marked = await api(`/notices/${unread.id}/read`, { method: "PUT", token, body: { read: true } });
  assert.equal(marked.body.data.read, true);

  const reread = await api(`/notices/${unread.id}`, { token });
  assert.equal(reread.body.data.read, true);

  await api("/notices/read-all", { method: "POST", token, body: {} });
  const all = await api("/notices", { token });
  assert.ok(all.body.data.every((n) => n.read));

  const missing = await api("/notices/does-not-exist", { token });
  assert.equal(missing.status, 404);
});

test("notifications can be created, listed and cleared", async () => {
  const created = await api("/notifications", {
    method: "POST",
    token,
    body: { type: "class", title: "Hello", message: "World" },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.data.read, false);
  assert.ok(created.body.data.time);

  const patched = await api(`/notifications/${created.body.data.id}`, { method: "PATCH", token, body: { read: true } });
  assert.equal(patched.body.data.read, true);

  const count = await api("/notifications/unread-count", { token });
  assert.equal(typeof count.body.data.count, "number");

  const cleared = await api("/notifications", { method: "DELETE", token, body: {} });
  assert.equal(cleared.status, 200);
  const empty = await api("/notifications", { token });
  assert.equal(empty.body.data.length, 0);
});

test("settings round-trip and reject unknown keys", async () => {
  const initial = await api("/settings", { token });
  assert.equal(initial.status, 200);
  assert.equal(typeof initial.body.data.classReminders, "boolean");

  const updated = await api("/settings", { method: "PUT", token, body: { classReminders: false, analytics: true } });
  assert.equal(updated.body.data.classReminders, false);
  assert.equal(updated.body.data.analytics, true);
  assert.notEqual(updated.body.data.emailDigest, undefined, "untouched keys keep their defaults");

  const unknown = await api("/settings", { method: "PUT", token, body: { nope: true } });
  assert.equal(unknown.status, 400);
});

/* ───────────────────────── search, stats, cgpa, chat ───────────────────────── */

test("global search groups results by entity", async () => {
  const res = await api("/search?q=Data%20Structure", { token });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.courses.length >= 1);
  for (const key of ["courses", "assignments", "exams", "routine", "notices"]) {
    assert.ok(Array.isArray(res.body.data[key]), `${key} must be an array`);
  }

  const empty = await api("/search?q=", { token });
  assert.equal(empty.body.data.courses.length, 0);
});

test("stats match the seeded profile", async () => {
  const res = await api("/stats", { token });
  assert.equal(res.body.data.cgpa, 3.42);
  assert.equal(res.body.data.assignments.total, 7);
  assert.ok(res.body.data.notices.total >= 1);
});

test("cgpa rows and history are exposed", async () => {
  const courses = await api("/cgpa/courses", { token });
  assert.equal(courses.body.data.length, 4);

  const history = await api("/cgpa/history", { token });
  assert.equal(history.body.data.length, 7);
});

test("chat endpoint honours the documented { reply } contract", async () => {
  const res = await api("/chat", {
    method: "POST",
    token,
    body: { messages: [{ role: "user", content: "Explain Big-O notation briefly" }] },
  });
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.reply, "string");
  assert.ok(res.body.reply.length > 10);
  assert.equal(res.body.data, undefined);

  const empty = await api("/chat", { method: "POST", token, body: { messages: [] } });
  assert.equal(empty.status, 400);

  const history = await api("/chat", { token });
  assert.ok(history.body.data.length >= 2, "transcript is persisted");

  await api("/chat", { method: "DELETE", token, body: {} });
  const cleared = await api("/chat", { token });
  assert.equal(cleared.body.data.length, 0);
});

/* ───────────────────────── account ───────────────────────── */

test("profile updates keep the account email stable", async () => {
  const res = await api("/users/me", { method: "PUT", token, body: { bio: "Updated bio", attendance: 92 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.bio, "Updated bio");
  assert.equal(res.body.data.user.attendance, 92);
  assert.equal(res.body.data.user.email, DEMO.email);
});

test("password change validates the current password", async () => {
  const wrong = await api("/users/me/password", { method: "POST", token, body: { current: "nope", next: "newpass123" } });
  assert.equal(wrong.status, 400);

  const same = await api("/users/me/password", { method: "POST", token, body: { current: DEMO.password, next: DEMO.password } });
  assert.equal(same.status, 400);
});

test("reset restores the showcase dataset", async () => {
  const res = await api("/users/me/reset", { method: "POST", token, body: {} });
  assert.equal(res.status, 200);
  const courses = await api("/courses", { token });
  assert.equal(courses.body.data.length, 7);
});

test("users cannot see or modify each other's data", async () => {
  const other = await loginAs(otherAccount.email, otherAccount.password);

  const mine = (await api("/courses", { token })).body.data;
  const theirs = (await api("/courses", { token: other })).body.data;

  const myIds = new Set(mine.map((c) => c.id));
  assert.ok(theirs.length > 0, "second user has their own rows");
  assert.ok(theirs.every((c) => !myIds.has(c.id)), "row ids must not be shared between users");

  const crossDelete = await api(`/courses/${theirs[0].id}`, { method: "DELETE", token });
  assert.equal(crossDelete.status, 404, "cross-user deletes must 404, not 200");

  const crossRead = await api(`/courses/${theirs[0].id}`, { token });
  assert.equal(crossRead.status, 404, "cross-user reads must 404");
});

test("logout revokes the access token server-side", async () => {
  const temp = await api("/auth/login", { method: "POST", body: { email: DEMO.email, password: DEMO.password } });
  const tempToken = temp.body.data.token;

  const before = await api("/auth/me", { token: tempToken });
  assert.equal(before.status, 200);

  const out = await api("/auth/logout", { method: "POST", token: tempToken, body: {} });
  assert.equal(out.status, 200);

  const after = await api("/auth/me", { token: tempToken });
  assert.equal(after.status, 401, "a revoked token must stop working");
});
