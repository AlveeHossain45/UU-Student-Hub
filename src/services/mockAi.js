/** Realistic canned responses for the demo AI assistant. */

const NORMALIZATION = `## DBMS Normalization — explained simply

**Normalization** is the process of organizing a database to **reduce duplicate data** and **avoid update problems** (anomalies).

Think of it like cleaning a messy spreadsheet into neat, related tables.

### 1NF — First Normal Form
- Every cell holds **one value** (no lists like "Math, Physics").
- Each row is unique (has a primary key).

### 2NF — Second Normal Form
- Must be in 1NF.
- Every non-key column depends on the **whole** primary key (no partial dependency).
- Example: in \`Enrollment(StudentID, CourseID, CourseName)\`, *CourseName* depends only on *CourseID* → move it to a \`Course\` table.

### 3NF — Third Normal Form
- Must be in 2NF.
- No **transitive dependency**: non-key columns shouldn't depend on other non-key columns.
- Example: \`Student(ID, DeptID, DeptName)\` → *DeptName* depends on *DeptID*, so create a \`Department\` table.

### BCNF — Boyce-Codd Normal Form
- A stricter 3NF: for every dependency **X → Y**, X must be a **super key**.

### 💡 Quick memory trick
> "The key, the whole key, and nothing but the key."

**Tip for your CSE 223 exam:** practice identifying functional dependencies first — normalization questions become easy after that.`;

const MCQ = `## 10 MCQs on Data Structures

**1.** Which data structure follows **LIFO**?
A) Queue  B) Stack  C) Array  D) Tree
✅ **Answer: B**

**2.** Time complexity of searching in a **balanced BST**?
A) O(1)  B) O(n)  C) O(log n)  D) O(n log n)
✅ **Answer: C**

**3.** Which is used for **BFS** traversal?
A) Stack  B) Queue  C) Heap  D) Hash table
✅ **Answer: B**

**4.** Worst-case time of **Quick Sort**?
A) O(n log n)  B) O(n)  C) O(n²)  D) O(log n)
✅ **Answer: C**

**5.** In a **min-heap**, the root contains:
A) Largest element  B) Smallest element  C) Median  D) Random element
✅ **Answer: B**

**6.** An **AVL tree** keeps the balance factor within:
A) −2 to 2  B) −1 to 1  C) 0 only  D) 0 to 2
✅ **Answer: B**

**7.** Inserting at the head of a **singly linked list** takes:
A) O(1)  B) O(n)  C) O(log n)  D) O(n²)
✅ **Answer: A**

**8.** Which structure is best for implementing **recursion**?
A) Queue  B) Stack  C) Graph  D) Array
✅ **Answer: B**

**9.** Average-case lookup in a **hash table**:
A) O(n)  B) O(log n)  C) O(1)  D) O(n²)
✅ **Answer: C**

**10.** **Dijkstra's algorithm** fails with:
A) Directed graphs  B) Negative edge weights  C) Cycles  D) Weighted graphs
✅ **Answer: B**

Want me to make a harder set, or focus on a specific topic like trees or graphs?`;

const STUDY_PLAN = `## 📅 7-Day Exam Study Plan

Here's a balanced plan based on your upcoming exams (Mathematics quiz, Database Systems and Data Structure midterms).

### Day 1 — Foundations
- 🧮 **MAT 201:** Vector spaces & linear independence (2 hrs)
- 🗃️ **CSE 223:** ER model review (1.5 hrs)

### Day 2 — Practice
- 🧮 **MAT 201:** Eigenvalues problem set (2 hrs)
- 🗃️ **CSE 223:** Relational algebra exercises (1.5 hrs)

### Day 3 — Quiz day prep
- 🧮 Solve 2 past quiz papers
- 😴 Sleep **7–8 hours** before the quiz

### Day 4 — Database deep dive
- 🗃️ SQL queries: joins, GROUP BY, sub-queries (2 hrs)
- 🗃️ Normalization 1NF → BCNF (1.5 hrs)

### Day 5 — Data Structures
- 🌳 Linked lists, stacks & queues (1.5 hrs)
- 🌳 BST & AVL rotations (2 hrs)

### Day 6 — Mock exams
- 📝 Full timed DBMS mock paper
- 📝 Code 3 DS problems by hand

### Day 7 — Revise & rest
- 🔁 Review mistakes & formula sheet
- 🚶 Light walk, early night

### ✅ Study tips
- Use the **Pomodoro** technique: 50 min focus + 10 min break.
- Teach a concept to a friend — it's the fastest way to find gaps.
- Keep your phone in another room while studying.

Good luck — you've got this! 💪`;

const RECURSION = `## Recursion — explained with an example

**Recursion** is when a function **calls itself** to solve a smaller version of the same problem.

Every recursive function needs two parts:
1. **Base case** — when to stop.
2. **Recursive case** — the function calling itself with a smaller input.

### Example: Factorial

\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive case
}

factorial(5); // 120
\`\`\`

### How it runs
- factorial(5) = 5 × factorial(4)
- factorial(4) = 4 × factorial(3)
- factorial(3) = 3 × factorial(2)
- factorial(2) = 2 × factorial(1)
- factorial(1) = **1** ← base case reached
- Then results multiply back up: 2 → 6 → 24 → **120**

### Real-life analogy
> Standing in a queue and asking "What's my position?" — you ask the person in front, who asks the person in front of them… until the first person says "1". Then answers flow back.

### ⚠️ Common mistakes
- Forgetting the base case → **stack overflow**.
- Not reducing the input → infinite recursion.

Recursion powers **tree traversals, DFS, merge sort and quick sort** — very important for CSE 221!`;

const GREETING = `Hi! 👋 I'm your **UU Study Assistant**.

I can help you with:
- 📘 Explaining difficult concepts simply
- 📝 Generating practice MCQs and questions
- 📅 Building personalized study plans
- 💻 Understanding code and algorithms

What would you like to study today?`;

const topics = [
  { keys: ["normaliz", "1nf", "2nf", "3nf", "bcnf"], reply: NORMALIZATION },
  { keys: ["mcq", "quiz me", "multiple choice", "questions about"], reply: MCQ },
  { keys: ["study plan", "schedule", "routine for exam", "plan for my exam", "prepare"], reply: STUDY_PLAN },
  { keys: ["recursion", "recursive"], reply: RECURSION },
  { keys: ["hello", "hi ", "hey", "assalamu", "salam"], reply: GREETING },
];

export function mockReply(input) {
  const text = ` ${input.toLowerCase()} `;
  const hit = topics.find((t) => t.keys.some((k) => text.includes(k)));
  if (hit) return hit.reply;

  if (text.includes("cgpa") || text.includes("gpa")) {
    return `## Improving your CGPA 📈

Your CGPA is a **credit-weighted average**, so high-credit courses matter most.

- Focus extra effort on **3-credit courses** — they move your CGPA the most.
- Aim for **A- (3.50) or above** in core CSE courses.
- Use the **Target CGPA Calculator** in the CGPA page to see exactly what average you need.
- Consider **improvement exams** for courses with C grades or lower.

Tip: consistent class attendance and assignment marks often decide the difference between an A- and an A.`;
  }

  return `Great question! Here's a structured way to approach **"${input.trim().slice(0, 80)}"**:

### 1. Understand the core idea
Start with the definition and *why* the concept exists — what problem does it solve?

### 2. Break it into parts
List the key components and learn them one by one. Draw diagrams where possible.

### 3. Work through an example
Solve at least **2–3 examples** by hand before looking at solutions.

### 4. Test yourself
- Explain it in your own words
- Try a past exam question
- Ask me for MCQs on the topic!

> 💡 *This is a demo AI running in mock mode. Connect a backend (see \`src/services/aiService.js\`) for real, detailed answers.*`;
}
