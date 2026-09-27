import { addDays, toDateInput, toDateTimeInput } from "../utils/helpers.js";

const now = new Date();
const at = (days, h, m = 0) => {
  const d = addDays(now, days);
  d.setHours(h, m, 0, 0);
  return d;
};

export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Civil Engineering",
  "Business Administration",
  "English",
  "Law",
  "Economics",
  "Architecture",
];

export const SEMESTERS = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  const s = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${s} Semester`;
});

export const DEMO_CREDENTIALS = {
  email: "alvee@uttarauniversity.edu.bd",
  password: "demo1234",
};

export const DEMO_USER = {
  id: "u-demo",
  name: "Mohammad Alvee Hossain",
  studentId: "UU-CSE-2023-001",
  email: DEMO_CREDENTIALS.email,
  password: DEMO_CREDENTIALS.password,
  university: "Uttara University",
  department: "Computer Science & Engineering",
  program: "B.Sc. in Computer Science & Engineering",
  semester: "8th Semester",
  batch: "Batch 57 (Spring 2023)",
  phone: "+880 1712-345678",
  bio: "CSE undergrad passionate about data systems, AI and building products students love.",
  avatar: "",
  cgpa: 3.42,
  creditsCompleted: 96,
  coursesCompleted: 32,
  attendance: 87,
};

export const initialCourses = [
  {
    id: "c1",
    code: "CSE 221",
    name: "Data Structure",
    credits: 3,
    instructor: "Dr. Rahman",
    progress: 72,
    color: "blue",
    description:
      "Fundamental data structures including arrays, linked lists, stacks, queues, trees, heaps, hash tables and graphs, with algorithmic analysis and practical implementation.",
  },
  {
    id: "c2",
    code: "CSE 223",
    name: "Database Systems",
    credits: 3,
    instructor: "Dr. Nusrat Jahan",
    progress: 64,
    color: "violet",
    description:
      "Relational model, SQL, ER modelling, normalization, indexing, transactions, concurrency control and recovery in modern database management systems.",
  },
  {
    id: "c3",
    code: "CSE 224",
    name: "Database Systems Lab",
    credits: 1.5,
    instructor: "Tanvir Ahmed",
    progress: 80,
    color: "indigo",
    description: "Hands-on laboratory work with SQL, stored procedures, triggers and building a database-backed application.",
  },
  {
    id: "c4",
    code: "MAT 201",
    name: "Mathematics",
    credits: 3,
    instructor: "Prof. Kamal Uddin",
    progress: 58,
    color: "amber",
    description: "Linear algebra, vector spaces, eigenvalues & eigenvectors, complex variables and their applications in engineering.",
  },
  {
    id: "c5",
    code: "CSE 411",
    name: "Artificial Intelligence",
    credits: 3,
    instructor: "Dr. Farhana Akter",
    progress: 46,
    color: "emerald",
    description:
      "Intelligent agents, search strategies, knowledge representation, reasoning under uncertainty and an introduction to machine learning.",
  },
  {
    id: "c6",
    code: "CSE 431",
    name: "Computer Networks",
    credits: 3,
    instructor: "Md. Shahidul Islam",
    progress: 51,
    color: "cyan",
    description: "Network architectures, the OSI & TCP/IP models, routing, switching, subnetting, transport protocols and network security basics.",
  },
  {
    id: "c7",
    code: "CSE 400",
    name: "Capstone Project",
    credits: 3,
    instructor: "Dr. Rahman",
    progress: 35,
    color: "rose",
    description: "A semester-long team project applying software engineering principles to design, build and present a real-world solution.",
  },
];

/* Routine templates, rotated so that "today" always has the showcase schedule */
const T = {
  A: [
    ["CSE 221", "Data Structure", "Dr. Rahman", "Room 502", "09:00", "10:30"],
    ["CSE 223", "Database Systems", "Dr. Nusrat Jahan", "Room 401", "11:30", "13:00"],
    ["MAT 201", "Mathematics", "Prof. Kamal Uddin", "Room 302", "14:00", "15:30"],
    ["CSE 431", "Computer Networks", "Md. Shahidul Islam", "Room 605", "16:30", "18:00"],
  ],
  B: [
    ["CSE 411", "Artificial Intelligence", "Dr. Farhana Akter", "Room 704", "08:30", "10:00"],
    ["CSE 224", "Database Systems Lab", "Tanvir Ahmed", "Lab 3", "10:30", "13:00"],
    ["CSE 400", "Capstone Project", "Dr. Rahman", "Room 201", "14:30", "16:00"],
  ],
  C: [
    ["CSE 223", "Database Systems", "Dr. Nusrat Jahan", "Room 401", "09:00", "10:30"],
    ["CSE 221", "Data Structure", "Dr. Rahman", "Room 502", "11:00", "12:30"],
    ["CSE 411", "Artificial Intelligence", "Dr. Farhana Akter", "Room 704", "13:30", "15:00"],
  ],
  D: [
    ["MAT 201", "Mathematics", "Prof. Kamal Uddin", "Room 302", "10:00", "11:30"],
    ["CSE 431", "Computer Networks", "Md. Shahidul Islam", "Room 605", "12:00", "13:30"],
    ["CSE 400", "Capstone Project", "Dr. Rahman", "Room 201", "15:00", "16:30"],
  ],
  E: [
    ["CSE 221", "Data Structure", "Dr. Rahman", "Room 502", "09:30", "11:00"],
    ["CSE 224", "Database Systems Lab", "Tanvir Ahmed", "Lab 3", "11:30", "14:00"],
  ],
  F: [["CSE 400", "Capstone Project", "Dr. Rahman", "Project Lab", "10:00", "12:00"]],
  G: [],
};

const order = ["A", "B", "C", "D", "E", "F", "G"];
export const initialRoutine = order.flatMap((key, offset) => {
  const day = (now.getDay() + offset) % 7;
  return T[key].map(([courseCode, courseName, teacher, room, start, end], i) => ({
    id: `r-${key}-${i}`,
    day,
    courseCode,
    courseName,
    teacher,
    room,
    start,
    end,
  }));
});

export const initialAssignments = [
  {
    id: "a1",
    course: "CSE 221",
    title: "Implement AVL Tree with Rotations",
    description: "Implement insertion, deletion and all four rotation cases. Include time-complexity analysis and test cases.",
    deadline: toDateTimeInput(at(2, 23, 59)),
    priority: "high",
    status: "in-progress",
  },
  {
    id: "a2",
    course: "CSE 223",
    title: "ER Diagram & Normalization Report",
    description: "Design an ER diagram for a university library system and normalize the schema up to BCNF.",
    deadline: toDateTimeInput(at(4, 23, 59)),
    priority: "medium",
    status: "pending",
  },
  {
    id: "a3",
    course: "CSE 411",
    title: "A* Search Pathfinding Visualizer",
    description: "Build a grid-based visualizer comparing A*, BFS and Dijkstra with admissible heuristics.",
    deadline: toDateTimeInput(at(6, 18, 0)),
    priority: "high",
    status: "pending",
  },
  {
    id: "a4",
    course: "MAT 201",
    title: "Eigenvalues Problem Set 5",
    description: "Solve problems 1–12 from Chapter 7. Show full working for diagonalization questions.",
    deadline: toDateTimeInput(at(1, 10, 0)),
    priority: "medium",
    status: "pending",
  },
  {
    id: "a5",
    course: "CSE 431",
    title: "Subnetting Lab Report",
    description: "Document the VLSM subnetting lab using Cisco Packet Tracer with screenshots and routing tables.",
    deadline: toDateTimeInput(at(-1, 23, 59)),
    priority: "high",
    status: "pending",
  },
  {
    id: "a6",
    course: "CSE 400",
    title: "Capstone Proposal Draft",
    description: "Submit the problem statement, objectives, methodology and timeline for the capstone project.",
    deadline: toDateTimeInput(at(-3, 17, 0)),
    priority: "low",
    status: "completed",
  },
  {
    id: "a7",
    course: "CSE 224",
    title: "SQL Joins Lab Sheet",
    description: "Complete lab sheet 6 on INNER, LEFT, RIGHT and FULL joins with sub-queries.",
    deadline: toDateTimeInput(at(-5, 12, 0)),
    priority: "low",
    status: "completed",
  },
];

export const initialExams = [
  {
    id: "e1",
    course: "CSE 223",
    title: "Database Systems",
    type: "Midterm",
    date: toDateInput(at(5, 10)),
    time: "10:00",
    room: "Room 501",
    syllabus: "ER model, relational algebra, SQL, normalization (1NF–BCNF).",
  },
  {
    id: "e2",
    course: "CSE 221",
    title: "Data Structure",
    type: "Midterm",
    date: toDateInput(at(8, 14)),
    time: "14:00",
    room: "Room 502",
    syllabus: "Linked lists, stacks, queues, BST, AVL trees and heaps.",
  },
  {
    id: "e3",
    course: "MAT 201",
    title: "Mathematics",
    type: "Quiz",
    date: toDateInput(at(2, 9)),
    time: "09:00",
    room: "Room 302",
    syllabus: "Vector spaces, linear independence, eigenvalues.",
  },
  {
    id: "e4",
    course: "CSE 411",
    title: "Artificial Intelligence",
    type: "Final",
    date: toDateInput(at(21, 10)),
    time: "10:00",
    room: "Room 704",
    syllabus: "Complete syllabus.",
  },
  {
    id: "e5",
    course: "CSE 431",
    title: "Computer Networks",
    type: "Quiz",
    date: toDateInput(at(-6, 11)),
    time: "11:00",
    room: "Room 605",
    syllabus: "OSI model, TCP/IP, subnetting.",
  },
];

export const NOTICE_CATEGORIES = ["Academic", "Exam", "Registration", "General", "Event"];

export const initialNotices = [
  {
    id: "n1",
    title: "Midterm Examination Schedule Published",
    description:
      "The midterm examination schedule for all undergraduate programs has been published. Students are requested to check their respective department notice boards and the student portal for the detailed routine. Admit cards will be available from the accounts section after clearing dues. Students must bring their university ID card to the exam hall.",
    date: toDateInput(at(-1, 9)),
    category: "Exam",
    read: false,
    pinned: true,
  },
  {
    id: "n2",
    title: "Course Registration for Next Semester Opens",
    description:
      "Online course registration for the upcoming semester will open next week. Students must meet their academic advisor before finalizing registration. Late registration will incur an additional fee. Please ensure all previous dues are cleared before the registration window.",
    date: toDateInput(at(-2, 10)),
    category: "Registration",
    read: false,
    pinned: true,
  },
  {
    id: "n3",
    title: "Makeup Class for CSE 221 (Data Structure)",
    description:
      "A makeup class for CSE 221 Section A will be held this Saturday from 10:00 AM to 11:30 AM in Room 502. Attendance is mandatory as the topic will be covered in the midterm examination.",
    date: toDateInput(at(-2, 14)),
    category: "Academic",
    read: false,
    pinned: false,
  },
  {
    id: "n4",
    title: "UU Innovate — Annual Tech Fest",
    description:
      "The Department of CSE is organizing 'UU Innovate', featuring a hackathon, project showcase, programming contest and robotics exhibition. Teams of up to 4 members can register through the CSE Club. Exciting prizes and certificates for all participants!",
    date: toDateInput(at(-3, 12)),
    category: "Event",
    read: true,
    pinned: false,
  },
  {
    id: "n5",
    title: "Tuition Fee Payment Deadline Extended",
    description:
      "The deadline for the second installment of tuition fees has been extended by one week. Students can pay via bank, bKash or Nagad using their student ID as reference. Late fees will apply after the extended deadline.",
    date: toDateInput(at(-4, 11)),
    category: "Registration",
    read: false,
    pinned: false,
  },
  {
    id: "n6",
    title: "Central Library Hours Extended During Exams",
    description:
      "The central library will remain open from 8:00 AM to 9:00 PM during the examination period, including weekends. Students must present their ID cards to access the reading rooms and digital resources.",
    date: toDateInput(at(-5, 9)),
    category: "General",
    read: true,
    pinned: false,
  },
  {
    id: "n7",
    title: "Industry Seminar: Careers in Artificial Intelligence",
    description:
      "Join us for a seminar with senior engineers from leading tech companies discussing career paths in AI and machine learning. The session will be held in the university auditorium. Registration is free for all students.",
    date: toDateInput(at(-6, 15)),
    category: "Event",
    read: true,
    pinned: false,
  },
  {
    id: "n8",
    title: "Capstone Project Submission Guidelines",
    description:
      "Final-year students must follow the updated capstone report template. Reports must include plagiarism check results below 20%. Soft copies must be submitted through the department portal along with the source code repository link.",
    date: toDateInput(at(-8, 10)),
    category: "Academic",
    read: true,
    pinned: false,
  },
  {
    id: "n9",
    title: "Improvement Examination Application",
    description:
      "Students wishing to sit for improvement examinations must submit applications to the Controller of Examinations office within the given deadline. A maximum of two courses can be improved per semester.",
    date: toDateInput(at(-10, 10)),
    category: "Exam",
    read: true,
    pinned: false,
  },
  {
    id: "n10",
    title: "Campus Closed for National Holiday",
    description:
      "The university will remain closed on the upcoming national holiday. All classes and offices will be closed. Classes will resume as per the regular schedule on the following working day.",
    date: toDateInput(at(-12, 10)),
    category: "General",
    read: true,
    pinned: false,
  },
];

export const initialNotifications = [
  {
    id: "nt1",
    type: "class",
    title: "Upcoming class",
    message: "Data Structure (CSE 221) starts soon in Room 502.",
    time: at(0, now.getHours(), Math.max(0, now.getMinutes() - 5)).toISOString(),
    read: false,
  },
  {
    id: "nt2",
    type: "assignment",
    title: "Assignment deadline",
    message: "Eigenvalues Problem Set 5 is due tomorrow at 10:00 AM.",
    time: at(0, Math.max(0, now.getHours() - 2)).toISOString(),
    read: false,
  },
  {
    id: "nt3",
    type: "exam",
    title: "Exam reminder",
    message: "Mathematics quiz in 2 days — Room 302, 09:00 AM.",
    time: at(-1, 18).toISOString(),
    read: false,
  },
  {
    id: "nt4",
    type: "notice",
    title: "New notice",
    message: "Midterm Examination Schedule has been published.",
    time: at(-1, 9).toISOString(),
    read: true,
  },
  {
    id: "nt5",
    type: "assignment",
    title: "Assignment overdue",
    message: "Subnetting Lab Report was due yesterday.",
    time: at(-1, 8).toISOString(),
    read: true,
  },
];

export const initialSettings = {
  classReminders: true,
  assignmentReminders: true,
  examReminders: true,
  noticeAlerts: true,
  emailDigest: false,
  profilePublic: true,
  showCgpa: true,
  analytics: false,
};

export const GPA_HISTORY = [
  { label: "S1", gpa: 3.18 },
  { label: "S2", gpa: 3.31 },
  { label: "S3", gpa: 3.27 },
  { label: "S4", gpa: 3.45 },
  { label: "S5", gpa: 3.52 },
  { label: "S6", gpa: 3.38 },
  { label: "S7", gpa: 3.61 },
];

export const initialCgpaCourses = [
  { id: "g1", code: "CSE 221", name: "Data Structure", credit: 3, grade: "A" },
  { id: "g2", code: "CSE 223", name: "Database Systems", credit: 3, grade: "A-" },
  { id: "g3", code: "CSE 224", name: "Database Systems Lab", credit: 1.5, grade: "A+" },
  { id: "g4", code: "MAT 201", name: "Mathematics", credit: 3, grade: "B+" },
];
