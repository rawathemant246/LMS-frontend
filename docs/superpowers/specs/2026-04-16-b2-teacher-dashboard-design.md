# B2: Teacher Dashboard — Design Spec

## Goal

Build 12 Teacher Dashboard pages — teacher-scoped views of school data + AI-powered teaching tools + student insight analytics.

## Context

- **Existing admin pages** (B1c): Dashboard, Academic, Students, Teachers, Parents, Attendance, Fees, Timetable, Content, Exams, Gradebook, Announcements, Settings — 15 pages
- **Teacher nav** already defined in `lib/school-nav.ts` (needs 2 new items added)
- **Backend APIs**: All routes exist. Teacher pages call the same endpoints but the backend scopes results via org_id from JWT. Teacher-specific filtering (my classes only) is done frontend-side by matching teacher's user_id to teacher_assignments.
- **Design quality**: Use `frontend-design` skill for implementation. Pages should feel like a polished SaaS product, not a generic admin tool. Premium animations, creative layouts, distinctive visual identity.

## Tech Stack

Same as B1c: Next.js 15, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Framer Motion, Lucide, Recharts, sonner. All pages under `app/(school)/teacher/`.

## Architecture: Teacher Context

Teachers see only their assigned classes/subjects. This is determined by:
1. `GET /api/v1/teachers` — find teacher profile matching current user's auth user_id
2. Teacher's `id` → `GET /api/v1/teachers/{id}/assignments` — returns list of `{ subject_id, class_id, section_id }`
3. All other pages filter data by these assignments

Create a shared hook `hooks/use-teacher-context.ts`:
```
useTeacherProfile() — finds and caches teacher profile for current user
useTeacherAssignments() — returns assigned subject/class/section combos
useMyClasses() — derived: unique class-section pairs from assignments
useMySubjects() — derived: unique subjects from assignments
```

This context is used by every teacher page to scope data.

---

## Nav Update

Update `TEACHER_NAV` in `lib/school-nav.ts`:

```typescript
export const TEACHER_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/teacher/dashboard", icon: "LayoutDashboard" },
    { name: "My Classes", href: "/teacher/classes", icon: "BookOpen" },
  ]},
  { section: "DAILY", items: [
    { name: "Attendance", href: "/teacher/attendance", icon: "ClipboardCheck" },
    { name: "Timetable", href: "/teacher/timetable", icon: "Calendar" },
  ]},
  { section: "TEACHING", items: [
    { name: "Content", href: "/teacher/content", icon: "FileVideo" },
    { name: "Assignments", href: "/teacher/assignments", icon: "PenTool" },
    { name: "Exams", href: "/teacher/exams", icon: "FileText" },
    { name: "Gradebook", href: "/teacher/gradebook", icon: "BarChart3" },
  ]},
  { section: "INSIGHTS", items: [
    { name: "Student Insights", href: "/teacher/insights", icon: "TrendingUp" },
    { name: "AI Assistant", href: "/teacher/ai-assistant", icon: "Brain" },
  ]},
  { section: "COMMUNICATION", items: [
    { name: "Announcements", href: "/teacher/announcements", icon: "Megaphone" },
    { name: "Notifications", href: "/teacher/notifications", icon: "Bell" },
  ]},
];
```

---

## Page 1: Teacher Dashboard (`/teacher/dashboard`)

**Layout**: Welcome banner + KPI row + today's schedule + quick actions + mastery summary

**Welcome banner**: "Good morning, Mr. Sharma" with today's date. Gradient background matching brand.

**KPI cards** (4):
- My Classes (count of unique class-section assignments)
- My Students (total students across assigned sections)
- Today's Attendance % (if marked today, show %; if not, show "Not marked")
- Pending Submissions (assignments created by teacher with ungraded submissions)

**Today's schedule**: Horizontal timeline showing teacher's periods for today from timetable data. Current period highlighted. Shows subject + class-section for each slot.

**Quick actions**: 3-4 cards linking to key workflows — Mark Attendance, Create Assignment, AI Assistant, Enter Marks

**Class mastery summary**: Small heatmap or bar chart showing average mastery level per class-section. Uses `GET /students/{id}/mastery` aggregated.

**API hooks**: `useTeacherProfile`, `useTeacherAssignments`, `useSectionTimetable`, `useStudents`

---

## Page 2: My Classes (`/teacher/classes`)

**Layout**: Card grid of assigned class-section-subject combos

Each card:
- Class + Section label (e.g., "X-A")
- Subject name
- Student count
- Average mastery % (small progress bar)
- Last activity (e.g., "Attendance marked 2h ago")

Click a card → detail view showing:
- Student list for that section (name, roll, mastery level bar, attendance %)
- Quick links: Mark Attendance, View Gradebook, Create Assignment

**API hooks**: `useTeacherAssignments`, `useStudents(classId, sectionId)`, mastery data

---

## Page 3: Attendance (`/teacher/attendance`)

**Layout**: Same marking grid pattern as admin attendance page

Differences from admin:
- Section selector only shows teacher's assigned sections (from `useMyClasses()`)
- No academic year selector needed (uses current)
- Pre-selects today's date
- Shows completion status: "12 of 3 sections marked today"

**API hooks**: Reuses `useMarkAttendance`, `useSectionStudents` from `hooks/use-attendance.ts`

---

## Page 4: Timetable (`/teacher/timetable`)

**Layout**: Read-only weekly grid showing teacher's own schedule

- No class/section selector — shows all the teacher's slots across all assigned sections
- Grid: rows = periods, columns = Mon-Sat
- Each filled cell: subject name + class-section (e.g., "Math — X-A")
- Color-coded by subject (same palette as admin timetable)
- Current day column highlighted
- Current period row highlighted with pulsing border

**API hooks**: `usePeriodDefinitions`, timetable data filtered to teacher's slots

---

## Page 5: Content (`/teacher/content`)

**Layout**: Same tree sidebar + detail panel as admin content page

Differences from admin:
- Tree only shows teacher's assigned subjects (from `useMySubjects()`)
- Full CRUD on chapters, topics, learning objects within their subjects
- Upload via dropzone (same as admin)

**API hooks**: Reuses hooks from `hooks/use-content.ts`, filtered by teacher's subjects

---

## Page 6: Assignments (`/teacher/assignments`)

**Layout**: Two tabs — My Assignments, Grade Submissions

**Tab 1 — My Assignments:**
- List of assignments created by this teacher
- Each card: title, section, subject, due date, submission count (e.g., "23/45 submitted"), status badge
- "+ Create Assignment" dialog: title, description (textarea), section_id (from teacher's sections), subject_id, due_date, max_marks, attachments (file upload)
- Publish button on draft assignments

**Tab 2 — Grade Submissions:**
- Assignment selector dropdown (teacher's assignments only)
- When selected: submissions table
  - Columns: Student, Submitted At, Status (submitted/graded/late), Marks, Actions
  - Click "Grade" → grading dialog: view submission content, marks input, feedback textarea, rubric selector (optional)
  - Late submissions highlighted

**API hooks**:
- `useAssignments(sectionId)` → `GET /api/v1/sections/{id}/assignments`
- `useCreateAssignment()` → `POST /api/v1/assignments`
- `usePublishAssignment()` → `POST /api/v1/assignments/{id}/publish`
- `useSubmissions(assignmentId)` → `GET /api/v1/assignments/{id}/submissions`
- `useGradeSubmission()` → `PATCH /api/v1/submissions/{id}/grade`
- `useRubrics()` → `GET /api/v1/rubrics`
- `useCreateRubric()` → `POST /api/v1/rubrics`

---

## Page 7: Exams (`/teacher/exams`)

**Layout**: Three tabs — My Exams, Question Bank, Enter Marks

Same as admin exams page but:
- Exams tab: filtered to teacher's subjects, can create exams for their subjects
- Question Bank: filtered to teacher's subjects, full CRUD
- Enter Marks: filtered to teacher's exams, same spreadsheet grid

**API hooks**: Reuses hooks from `hooks/use-exams.ts`

---

## Page 8: Gradebook (`/teacher/gradebook`)

**Layout**: Four tabs — Marks Entry, Internal Marks, Grade Scales, Report Cards

Same as admin gradebook but:
- Pre-filtered to teacher's sections/subjects
- Grade Scales: read-only view
- Report Cards: can view/download for their students but not generate/publish

**NEW Tab — Internal Marks:**
- Section selector (teacher's sections)
- Internal assessment categories: Classwork, Homework, Project, Lab Work (from config)
- Grid: students as rows, assessment types as columns
- Inline editable marks per student per type
- "Save" → `POST /api/v1/internal-marks`
- Shows term total (weighted sum)

**API hooks**: Reuses gradebook hooks + new `useInternalMarks`, `useCreateInternalMark`

---

## Page 9: AI Assistant (`/teacher/ai-assistant`)

**THE SIGNATURE PAGE — use frontend-design skill for premium quality**

**Layout**: Tool cards at top → active tool form → rich result panel

**Tool 1 — Lesson Plan Generator:**
- Inputs: subject, chapter, topic (from teacher's assigned subjects), duration (minutes), class level, board
- Calls the AI service tutor workflow with a system prompt for lesson planning
- Output: structured lesson plan with sections (Objectives, Warm-up, Main Lesson, Practice, Assessment, Homework)
- Actions: Copy to clipboard, Download as PDF, Print, Regenerate

**Tool 2 — Quiz Generator:**
- Inputs: subject, chapter, topic, question_type (multi-select), difficulty, count (1-20)
- Calls `POST /content/generate-questions` on AI service (via Rust backend proxy)
- Output: generated questions displayed as cards with answers
- Actions: Add to Question Bank (calls `useCreateQuestion` for each), Copy, Download
- "Add All to Bank" bulk action

**Tool 3 — Class Insights (coming soon):**
- Placeholder card with "Coming Soon" badge
- Description: AI-analyzed performance trends, at-risk student identification

**Tool 4 — Content Summarizer (coming soon):**
- Placeholder card
- Description: Chapter summaries, revision notes generation

**Design direction**: Dark-on-light with gradient accents, glass morphism cards, sparkle/AI indicators, streaming text animation for AI responses (typewriter effect), premium feel. The AI assistant should feel magical — this is the product's differentiator.

**API hooks** (`hooks/use-ai-assistant.ts`):
- `useGenerateLessonPlan()` — calls Rust backend which proxies to AI service
- `useGenerateQuiz()` — calls `POST /api/v1/content/generate-questions` (doesn't exist yet in Rust backend, but the AI service has `/content/generate-questions`)

Implementation note: For quiz generation, the Rust backend already proxies to the AI service. For lesson plan generation in v1, the frontend calls the existing tutor chat endpoint (`POST /api/v1/tutor/sessions` + `POST /api/v1/tutor/sessions/{id}/messages`) with a specially crafted system context requesting a lesson plan format. This avoids adding new backend routes. The AI service's tutor workflow already handles educational content generation.

---

## Page 10: Announcements (`/teacher/announcements`)

**Layout**: Same as admin announcements page

Differences:
- Scope limited to class/section (no school-wide)
- Target selectors show only teacher's assigned classes/sections
- Can view school-wide announcements (read-only) but create only class/section-scoped

**API hooks**: Reuses `hooks/use-announcements.ts`

---

## Page 11: Student Insights (`/teacher/insights`)

**Layout**: Student selector → insight panels

**Student selector**: Class-section dropdown (teacher's sections) → student list → click student

**Insight panels** (for selected student):
1. **Mastery Heatmap**: Concept mastery levels from `GET /students/{id}/mastery`. Grid of concepts colored by mastery level (red < 40%, yellow 40-70%, green > 70%).
2. **Performance Trend**: Line chart of exam scores over time using Recharts.
3. **Attendance Summary**: Present/absent/late counts with percentage.
4. **AI Tutor Sessions**: List of student's tutor sessions from `GET /tutor/sessions?student_id=X`. Each session: topic, message count, rating, date. Click to expand and see conversation summary.
5. **Recommendations**: Based on mastery gaps — "Student needs help with: Polynomials (32% mastery), Trigonometry (45% mastery)"

**API hooks** (`hooks/use-student-insights.ts`):
- `useStudentMastery(studentId)` → `GET /api/v1/students/{id}/mastery`
- `useStudentGradebook(studentId)` → `GET /api/v1/students/{id}/gradebook`
- `useStudentAttendance(studentId)` → `GET /api/v1/students/{id}/attendance`
- `useTutorSessions(studentId)` → `GET /api/v1/tutor/sessions` (filtered)

---

## Page 12: Notifications (`/teacher/notifications`)

**Layout**: Simple notification list

- List of notifications sorted by date (newest first)
- Each: icon, title, message, timestamp, read/unread indicator
- Click → marks as read
- "Mark All Read" button at top
- Unread count badge in the sidebar nav item + topbar bell icon

**API hooks** (`hooks/use-notifications.ts`):
- `useNotifications()` → `GET /api/v1/admin/notifications`
- `useMarkRead()` → `POST /api/v1/admin/notifications/{id}/read`
- `useMarkAllRead()` → `POST /api/v1/admin/notifications/read-all`

---

## Shared Animation Patterns

Same as B1c but elevated for product feel:
- Page transitions: smooth crossfade between pages
- Card grids: staggered entry with spring physics
- AI responses: typewriter text streaming effect
- Mastery heatmap: cells animate from gray → colored on load
- Charts: draw-in animation on mount
- Tab transitions: slide + fade

## File Structure

```
app/(school)/teacher/
  dashboard/page.tsx         ← NEW
  classes/page.tsx           ← NEW
  attendance/page.tsx        ← NEW
  timetable/page.tsx         ← NEW
  content/page.tsx           ← NEW
  assignments/page.tsx       ← NEW
  exams/page.tsx             ← NEW
  gradebook/page.tsx         ← NEW
  ai-assistant/page.tsx      ← NEW (premium design)
  announcements/page.tsx     ← NEW
  insights/page.tsx          ← NEW
  notifications/page.tsx     ← NEW

hooks/
  use-teacher-context.ts     ← NEW (shared teacher identity + assignments)
  use-assignments.ts         ← NEW
  use-ai-assistant.ts        ← NEW
  use-student-insights.ts    ← NEW
  use-notifications.ts       ← NEW

lib/
  school-nav.ts              ← MODIFY (add Student Insights + Notifications to TEACHER_NAV)
```

## Non-Goals

- No real-time chat between teacher and students (future feature)
- No video conferencing integration
- No lesson plan template library (v1 generates fresh each time)
- No AI service proxy route changes (use existing endpoints)
- No teacher profile editing (that's in admin Settings)
