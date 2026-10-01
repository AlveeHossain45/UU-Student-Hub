# 🎓 UU Student Hub

A premium all-in-one student platform for **Uttara University** students — **React + Vite + Tailwind CSS v4** on the front end, **Express + SQLite** on the back end.

## ✨ Features

- 🔐 Real authentication (register / login / remember me / protected routes, revocable sessions)
- 🏠 Dashboard with live next-class countdown, today's timeline, assignment tracker, exams, notices & GPA chart
- 📅 Weekly routine (week & day views, add / edit / delete classes)
- 📚 Courses with detail modal (description, progress, assignments, exams, schedule)
- 📝 Assignment CRUD with statuses (Pending, In Progress, Completed, auto-Overdue), filters & sorting
- 🧾 Exams CRUD with live countdowns
- 🧮 Smart CGPA calculator + Target CGPA planner (detects impossible targets)
- 📢 Notice center with search, category filters, read / unread (per-student read state)
- 🤖 AI Study Assistant (server-held key, streaming typing effect, copy, clear)
- 🔔 Notification center (unread count, mark read, mark all, delete) + automatic class reminders
- 👤 Editable profile with photo upload
- ⚙️ Settings: Light / Dark / System theme, notification toggles, password change, privacy, data reset
- 🔎 Global search modal — **Ctrl + K** / **⌘ + K**
- 📱 Fully responsive (collapsible desktop sidebar, mobile drawer)

## 📸 Screenshots

> **Placeholder** — run the app and save images under `screenshots/`, then replace the paths below.

```md
![Dashboard](screenshots/dashboard.png)
![Routine](screenshots/routine.png)
![CGPA Calculator](screenshots/cgpa.png)
```

## 🌐 Live Demo

<!-- Add a deployment URL here once the app is published. -->

*Not yet deployed — run locally with the steps below.*

## 🚀 Getting started

```bash
npm install
npm run dev:server   # API on http://localhost:3000
npm run dev          # Vite on http://localhost:5173  (second terminal)
```

`.env` already points the SPA at the API. Sign in with the demo account:

- Email: `alvee@uttarauniversity.edu.bd`
- Password: `demo1234`

(or click **"Use demo account"**, or register a new account)

### Two run modes

| Mode | When | Storage |
| --- | --- | --- |
| **API** | `VITE_API_URL` is set *and* the server answers `/api/health` | SQLite (`server/` + `data/app.db`) |
| **Local** | no `VITE_API_URL`, or the server is unreachable | browser `localStorage` |

The mode is resolved once at boot, so a build with a configured API still works offline — it simply falls back to the original localStorage demo instead of showing a broken login screen.

### One-process production build

```bash
npm run build        # bundles the SPA into dist/index.html (single file)
npm start            # API + SPA together on http://localhost:3000
```

`npm start` requires `NODE_ENV=production` semantics only for stricter defaults; it sets them automatically. Set `JWT_SECRET` for a real deployment (otherwise a random secret is generated once and stored in `data/.jwt-secret`).

---

## 🛠 Backend

Node 22 · Express · `node:sqlite` · JWT · zod — no native dependencies to compile.

```
server/
├── index.js            entry point (boot, seed, graceful shutdown)
├── start.js            production entry (npm start)
├── app.js              express app: security headers, CORS, logging, SPA hosting
├── config.js           env-driven config + JWT secret resolution
├── db/
│   ├── index.js        connection, helpers, re-entrant transactions
│   ├── schema.js       DDL + indexes
│   └── seed.js         demo student + showcase dataset
├── lib/
│   ├── collection.js   generic user-scoped CRUD repository
│   ├── errors.js       ApiError + error middleware
│   ├── passwords.js    scrypt hashing (built into Node)
│   ├── tokens.js       JWT sign/verify
│   └── validate.js     zod schemas
├── middleware/
│   ├── auth.js         bearer auth + session revocation
│   └── rateLimit.js    global + credential limiters
└── routes/
    ├── index.js        route table
    ├── auth.js  users.js  collections.js  notices.js
    ├── notifications.js  settings.js  cgpa.js
    ├── search.js  stats.js  chat.js
```

### Endpoints

All routes are prefixed with `/api`. Responses use `{ data }` on success and `{ error, code, details? }` on failure — **except `POST /api/chat`, which answers `{ reply }`** (the documented assistant contract).

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | liveness, env, seed stats |
| `POST` | `/auth/register` | creates account + seeds showcase data |
| `POST` | `/auth/login` | returns `{ user, token, expiresAt }` |
| `GET` | `/auth/me` | current user |
| `POST` | `/auth/logout` · `/auth/logout-all` | revokes the session server-side |
| `PUT` | `/users/me` | profile patch |
| `POST` | `/users/me/password` | changes password, signs out other devices |
| `POST` | `/users/me/reset` | restores the showcase dataset |
| `DELETE` | `/users/me` | deletes the account and all owned rows |
| `GET/POST` | `/courses` | `?q=` search, unique `(user, code)` |
| `GET/POST` | `/routine` | `?day=0..6` |
| `GET/POST` | `/assignments` | `?q= &status= &priority= &course= &sort=` |
| `GET/POST` | `/exams` | `?q= &upcoming=true &sort=` |
| `GET` | `/notices` · `GET /notices/:id` | shared board + per-user `read` |
| `PUT` | `/notices/:id/read` | mark one read/unread |
| `POST` | `/notices/read-all` | mark all read |
| `POST/PUT/DELETE` | `/notices…` | **admin only** (institution-wide content) |
| `GET/POST` | `/notifications` | `?q= &unread=true`, `GET /unread-count` |
| `PATCH` | `/notifications/:id` | `{ read: boolean }` |
| `POST` | `/notifications/read-all` | |
| `DELETE` | `/notifications` · `/notifications/:id` | clear all / one |
| `GET/PUT/PATCH` | `/settings` | strict schema — unknown keys are rejected |
| `GET/POST/PUT/DELETE` | `/cgpa/courses` | CGPA calculator rows |
| `GET/PUT` | `/cgpa/history` | semester GPA trend |
| `GET` | `/search?q=` | grouped results across all entities |
| `GET` | `/stats` | dashboard aggregates |
| `POST/GET/DELETE` | `/chat` | `{ messages }` → `{ reply }`, transcript persisted |

Every authenticated collection is scoped to the signed-in user: rows are invisible and unmodifiable across accounts (verified by tests).

### AI provider

The key never reaches the browser.

```bash
AI_PROVIDER=openai       # default: mock (built-in responder, no key needed)
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

### Configuration

See [.env.example](.env.example) for every variable (port, CORS origins, rate limits, JWT lifetime, AI provider, seed toggle).

### Security notes

- Passwords: **scrypt** with per-user salt and constant-time comparison.
- Sessions: JWT access tokens carry a session id; `logout`, password changes and account deletion revoke them server-side.
- Validation: every body/query goes through zod; column names come from schema shapes, so user input never reaches SQL identifiers.
- Rate limiting: global limiter plus a stricter one on credential endpoints.
- Headers: helmet with an explicit CSP (required because the SPA inlines its bundle), plus `frame-ancestors: none`.
- Timings: unknown emails still pay the cost of one password verification.

### Tests

```bash
npm test               # 21 API tests (node:test, in-memory SQLite, ephemeral port)
```

Covers auth, validation, CRUD, per-user isolation, ordering, search, stats, chat contract, and token revocation.

---

## 📂 Project structure

```
src/
├── components/
│   ├── ui/            Button, Card, Modal, Input, Select, Badge, Avatar, Dropdown,
│   │                  Toast, LoadingSkeleton, EmptyState, ErrorState, ConfirmDialog, Switch
│   ├── layout/        Sidebar, Navbar, ThemeToggle, NotificationPanel, SearchModal, navItems
│   ├── dashboard/     NextClassCard, TodayTimeline, GpaTrendChart
│   ├── forms/         AssignmentFormModal, ExamFormModal, ClassFormModal, CourseFormModal
│   ├── StatCard, CourseCard, AssignmentCard, NoticeCard, ClassCard,
│   └── PageHeader, Logo, Markdown, ErrorBoundary
├── context/           ThemeContext, AuthContext, DataContext, ToastContext
├── data/              mockData.js          (shared with the backend seed)
├── hooks/             useLocalStorage, useApiCollection, useNow, useDocumentTitle, useClassReminders
├── layouts/           DashboardLayout, AuthLayout
├── pages/             Login, Register, Dashboard, Routine, Courses, Assignments, Exams,
│                      CGPA, Notices, AIAssistant, Profile, Settings, NotFound
├── routes/            AppRoutes, ProtectedRoute
├── services/          api.js (HTTP client + mode resolution), aiService.js, mockAi.js
├── utils/             cn.js, helpers.js
├── App.jsx  main.jsx  index.css
server/                Express API (see above)
```

## 🤖 Connecting a real AI backend

`src/services/aiService.js` already targets the built-in endpoint:

- Backend mode → `POST ${VITE_API_URL}/chat` (holds the provider key).
- Or point at any provider with `VITE_AI_API_URL=https://your-backend/api/chat`.

The endpoint receives `POST { messages: [{ role, content }] }` and must return `{ reply: "..." }`. **Never put API keys in frontend code.**

## 🧰 Tech

React 19 · Vite 7 · Tailwind CSS v4 · React Router 7 · Lucide React · Context API
Express 4 · SQLite (`node:sqlite`) · JWT · zod · scrypt · helmet · express-rate-limit

> Note: authentication is a demo implementation suitable for this project — for a public deployment put it behind HTTPS, set a strong `JWT_SECRET`, and consider short-lived tokens with refresh rotation.
