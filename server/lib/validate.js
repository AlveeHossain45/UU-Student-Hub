import { z } from "zod";
import { badRequest } from "./errors.js";

/** Parse input with a zod schema, throwing a 400 ApiError with field details. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw badRequest(details[0]?.message || "Some of the values you entered are invalid.", details);
  }
  return result.data;
}

/* ---------- shared primitives ---------- */

export const zId = z.string().min(1).max(64);
export const zEmail = z
  .string()
  .trim()
  .min(5, "Enter a valid email address.")
  .max(160, "Email is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address.");
export const zPassword = z.string().min(6, "Password must be at least 6 characters.").max(200, "Password is too long.");
export const zDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00`).getTime()), "Enter a valid date.");
export const zTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Use the format HH:MM.")
  .refine((v) => Number(v.slice(0, 2)) < 24 && Number(v.slice(3)) < 60, "Enter a valid time.");
export const zDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use the format YYYY-MM-DDTHH:mm.")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date and time.");
export const zDay = z.coerce.number().int().min(0, "Day must be between 0 and 6.").max(6, "Day must be between 0 and 6.");
export const zPriority = z.enum(["low", "medium", "high"]);
export const zAssignmentStatus = z.enum(["pending", "in-progress", "completed", "overdue"]);
export const zNoticeCategory = z.enum(["Academic", "Exam", "Registration", "General", "Event"]);
export const zCourseColor = z.enum(["blue", "violet", "emerald", "amber", "rose", "cyan", "indigo", "teal"]);
export const zPercent = z.coerce.number().min(0).max(100);
export const zSearch = z.string().trim().max(120).optional();

/* ---------- entity schemas ---------- */

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  studentId: z.string().trim().min(3, "Enter your student ID.").max(60),
  email: zEmail,
  password: zPassword,
  department: z.string().trim().max(120).default(""),
  semester: z.string().trim().max(40).default(""),
});

export const loginSchema = z.object({
  email: zEmail,
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional().default(true),
});

export const courseSchema = z.object({
  code: z.string().trim().min(2, "Course code is required.").max(30),
  name: z.string().trim().min(2, "Course name is required.").max(140),
  credits: z.coerce.number().min(0).max(30).default(3),
  instructor: z.string().trim().max(120).default(""),
  progress: zPercent.default(0),
  color: zCourseColor.default("blue"),
  description: z.string().max(2000).default(""),
});

export const classObject = z.object({
  day: zDay,
  courseCode: z.string().trim().min(1, "Course code is required.").max(30),
  courseName: z.string().trim().min(1, "Course name is required.").max(140),
  teacher: z.string().trim().max(120).default(""),
  room: z.string().trim().max(60).default(""),
  start: zTime,
  end: zTime,
});

/** Full class schema including the cross-field rule (used for create/validate). */
export const classSchema = classObject.refine((v) => v.end > v.start, {
  message: "End time must be after start time.",
  path: ["end"],
});

export const assignmentSchema = z.object({
  course: z.string().trim().max(30).default(""),
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(180),
  description: z.string().max(4000).default(""),
  deadline: zDateTime,
  priority: zPriority.default("medium"),
  status: zAssignmentStatus.default("pending"),
});

export const examSchema = z.object({
  course: z.string().trim().max(30).default(""),
  title: z.string().trim().min(2, "Exam title is required.").max(180),
  type: z.enum(["Quiz", "Midterm", "Final", "Assignment", "Viva"]).default("Midterm"),
  date: zDate,
  time: zTime.default("10:00"),
  room: z.string().trim().max(60).default(""),
  syllabus: z.string().max(4000).default(""),
});

export const noticeSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(180),
  description: z.string().max(6000).default(""),
  date: zDate,
  category: zNoticeCategory.default("General"),
  pinned: z.coerce.boolean().default(false),
});

export const notificationSchema = z.object({
  type: z.enum(["class", "assignment", "exam", "notice", "info"]).default("info"),
  title: z.string().trim().min(1).max(180),
  message: z.string().max(600).default(""),
  time: z.string().datetime().optional(),
  read: z.coerce.boolean().default(false),
});

export const cgpaCourseSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(140),
  credit: z.coerce.number().min(0).max(30),
  grade: z.string().trim().min(1).max(5),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  studentId: z.string().trim().min(3).max(60).optional(),
  department: z.string().trim().max(120).optional(),
  program: z.string().trim().max(160).optional(),
  semester: z.string().trim().max(40).optional(),
  batch: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  bio: z.string().max(600).optional(),
  avatar: z.string().max(20000).optional(),
  university: z.string().trim().max(160).optional(),
  cgpa: z.coerce.number().min(0).max(4).optional(),
  creditsCompleted: z.coerce.number().min(0).max(1000).optional(),
  coursesCompleted: z.coerce.number().min(0).max(500).optional(),
  attendance: z.coerce.number().min(0).max(100).optional(),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: zPassword,
});

export const settingsSchema = z
  .object({
    classReminders: z.boolean().optional(),
    assignmentReminders: z.boolean().optional(),
    examReminders: z.boolean().optional(),
    noticeAlerts: z.boolean().optional(),
    emailDigest: z.boolean().optional(),
    profilePublic: z.boolean().optional(),
    showCgpa: z.boolean().optional(),
    analytics: z.boolean().optional(),
  })
  .strict();
