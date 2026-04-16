# B2: Teacher Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 12 Teacher Dashboard pages with shared teacher context, AI-powered teaching tools, and student insight analytics.

**Architecture:** All pages under `app/(school)/teacher/` using existing SchoolLayout. A shared `useTeacherContext` hook provides teacher identity and assignments — all pages filter data through this. Pages reuse existing admin hooks where possible (attendance, content, exams, gradebook, announcements). New hooks for teacher-specific features (assignments, AI assistant, student insights, notifications). The AI Assistant page uses `frontend-design` skill for premium visual quality.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Framer Motion, Lucide, Recharts, sonner

**Spec:** `docs/superpowers/specs/2026-04-16-b2-teacher-dashboard-design.md`

**Branch:** `feature/b2-teacher-dashboard`

**IMPORTANT for implementers:** Use the `frontend-design` skill for **all** page implementations. Every page should have premium product-quality design — not generic admin UI. Creative layouts, polished animations, distinctive visual identity. This is a SaaS product, not an internal tool.

---

### Task 1: Teacher context hook + nav update

**Files:**
- Create: `hooks/use-teacher-context.ts`
- Modify: `lib/school-nav.ts`

- [ ] **Step 1: Create teacher context hook**

Create `hooks/use-teacher-context.ts`:

```typescript
"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/lib/store";

export function useTeacherProfile() {
  const user = useUserStore((s) => s.user);
  const userId = user?.user_id ?? user?.id;
  return useQuery({
    queryKey: ["teacher-profile", userId],
    queryFn: async () => {
      const data = await api.get<any>("/api/v1/teachers");
      const teachers = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      return teachers.find((t: any) => t.auth_user_id === userId) ?? null;
    },
    enabled: !!userId,
  });
}

export function useTeacherAssignments(teacherId?: string) {
  return useQuery({
    queryKey: ["teacher-assignments", teacherId],
    queryFn: () => api.get<any>(`/api/v1/teachers/${teacherId}/assignments`),
    enabled: !!teacherId,
  });
}

export function useMyClasses(teacherId?: string) {
  const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
  return useMemo(() => {
    const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.data?.items ?? assignmentsRaw?.data ?? [];
    const seen = new Set<string>();
    return assignments.filter((a: any) => {
      const key = `${a.class_id}-${a.section_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [assignmentsRaw]);
}

export function useMySubjects(teacherId?: string) {
  const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
  return useMemo(() => {
    const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.data?.items ?? assignmentsRaw?.data ?? [];
    const seen = new Set<string>();
    return assignments.filter((a: any) => {
      if (seen.has(a.subject_id)) return false;
      seen.add(a.subject_id);
      return true;
    });
  }, [assignmentsRaw]);
}
```

- [ ] **Step 2: Update teacher nav in school-nav.ts**

In `lib/school-nav.ts`, replace the `TEACHER_NAV` export with:

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

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-teacher-context.ts lib/school-nav.ts
git commit -m "feat(b2): add teacher context hook and update nav for 12 pages

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Teacher Dashboard (`/teacher/dashboard`)

**Files:**
- Create: `app/(school)/teacher/dashboard/page.tsx`

- [ ] **Step 1: Create teacher dashboard page**

Use the `frontend-design` skill for premium design quality.

Page structure:
- Welcome banner: "Good morning, {teacher.first_name}" with today's date, gradient background
- 4 KPI cards: My Classes (count), My Students (total), Today's Attendance %, Pending Submissions
- Today's schedule: horizontal timeline of teacher's periods from timetable — current period highlighted
- Quick action cards (3-4): Mark Attendance, Create Assignment, AI Assistant, Enter Marks
- Class mastery summary widget: bar chart or mini cards per class showing average performance

Data hooks:
```typescript
const { data: teacher } = useTeacherProfile();
const teacherId = teacher?.id;
const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
const myClasses = useMyClasses(teacherId);
const { data: periodsRaw } = usePeriodDefinitions();
```

KPI computation:
- My Classes: `myClasses.length`
- My Students: sum students across sections (use `useSectionStudents` per section, or a single query)
- Today's Attendance: fetch today's attendance for teacher's sections, compute %
- Pending: count assignments where submission_count < student_count

Today's schedule: filter timetable slots to current day of week + teacher's user_id.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/dashboard/"
git commit -m "feat(b2): add Teacher Dashboard with KPIs, schedule, and quick actions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: My Classes (`/teacher/classes`)

**Files:**
- Create: `app/(school)/teacher/classes/page.tsx`

- [ ] **Step 1: Create my classes page**

Use `frontend-design` skill.

Card grid of teacher's assigned class-section-subject combos. Each card shows:
- Class + Section label (e.g., "X-A"), subject name
- Student count, average mastery % as small progress bar
- Last activity timestamp
- Click card → inline expansion or detail section showing student list with roll, name, mastery bar, attendance %
- Quick links: Mark Attendance, View Gradebook, Create Assignment

Data: `useTeacherAssignments(teacherId)` for cards, `useSectionStudents(sectionId)` for student list on expand.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/classes/"
git commit -m "feat(b2): add My Classes page with class cards and student detail

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Teacher Attendance (`/teacher/attendance`)

**Files:**
- Create: `app/(school)/teacher/attendance/page.tsx`

- [ ] **Step 1: Create teacher attendance page**

Use `frontend-design` skill. Same marking grid as admin attendance but:
- Section selector only shows teacher's assigned sections (from `useMyClasses(teacherId)`)
- Pre-selects today's date
- Shows completion status across sections: "2 of 3 sections marked today"
- No academic year selector (uses current year)

Data hooks: `useMyClasses(teacherId)` for section list, `useSectionStudents(sectionId)`, `useAttendance(sectionId, date)`, `useMarkAttendance()` — all from existing `hooks/use-attendance.ts`.

Marking UI: same as admin — student grid with P/A/L/HD toggle buttons per student. Save button submits all marks.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/attendance/"
git commit -m "feat(b2): add Teacher Attendance page scoped to assigned sections

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Teacher Timetable (`/teacher/timetable`)

**Files:**
- Create: `app/(school)/teacher/timetable/page.tsx`

- [ ] **Step 1: Create teacher timetable page**

Use `frontend-design` skill. Read-only weekly grid showing teacher's own schedule.

- No class/section selector — shows ALL the teacher's slots across all sections
- Grid: rows = periods (from `usePeriodDefinitions()`), columns = Mon-Sat
- Filled cells: subject name + class-section (e.g., "Math — X-A"), color-coded by subject
- Break rows: amber separator bars
- Current day column highlighted with subtle background
- Current period row highlighted with pulsing/glowing border

Data: `usePeriodDefinitions()` for rows, then for each of teacher's assigned sections call `useSectionTimetable(sectionId)` and merge — filter slots matching teacher's user_id.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/timetable/"
git commit -m "feat(b2): add Teacher Timetable page with read-only weekly view

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Teacher Content (`/teacher/content`)

**Files:**
- Create: `app/(school)/teacher/content/page.tsx`

- [ ] **Step 1: Create teacher content page**

Use `frontend-design` skill. Same tree sidebar + detail panel as admin content page but:
- Tree only shows teacher's assigned subjects (from `useMySubjects(teacherId)`)
- Full CRUD on chapters, topics, learning objects within their subjects
- Upload via react-dropzone (same as admin)

Data hooks: reuses `useChapters`, `useTopics`, `useLearningObjects`, `useCreateChapter`, `useCreateTopic`, `useCreateLearningObject`, `useUploadDirect` from `hooks/use-content.ts`. `useMySubjects(teacherId)` for filtering the tree root.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/content/"
git commit -m "feat(b2): add Teacher Content page scoped to assigned subjects

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Assignments hooks + page (`/teacher/assignments`)

**Files:**
- Create: `hooks/use-assignments.ts`
- Create: `app/(school)/teacher/assignments/page.tsx`

- [ ] **Step 1: Create assignment hooks**

Create `hooks/use-assignments.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useSectionAssignments(sectionId?: string) {
  return useQuery({
    queryKey: ["assignments", sectionId],
    queryFn: () => api.get<any>(`/api/v1/sections/${sectionId}/assignments`),
    enabled: !!sectionId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/assignments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAssignment(id?: string) {
  return useQuery({
    queryKey: ["assignments", "detail", id],
    queryFn: () => api.get<any>(`/api/v1/assignments/${id}`),
    enabled: !!id,
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/assignments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/assignments/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment published");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => api.get<any>(`/api/v1/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/submissions/${id}/grade`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Submission graded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRubrics() {
  return useQuery({ queryKey: ["rubrics"], queryFn: () => api.get<any>("/api/v1/rubrics") });
}

export function useCreateRubric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/rubrics", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rubrics"] });
      toast.success("Rubric created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create assignments page**

Use `frontend-design` skill. Two tabs: My Assignments, Grade Submissions.

**Tab 1 — My Assignments:**
- Section filter (teacher's sections from `useMyClasses`)
- Assignment cards: title, section, subject, due date, submission count (e.g., "23/45"), status badge (draft/published/closed)
- "+ Create Assignment" dialog: title, description (textarea), section_id, subject_id (from teacher's assignments), due_date, max_marks
- Publish button on draft assignments

**Tab 2 — Grade Submissions:**
- Assignment selector (teacher's assignments)
- Submissions table: Student, Submitted At, Status (submitted/graded/late), Marks, Actions
- "Grade" button → dialog: view submission, marks input, feedback textarea, optional rubric
- Late submissions highlighted in amber

- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

```bash
git add hooks/use-assignments.ts "app/(school)/teacher/assignments/"
git commit -m "feat(b2): add Assignments page with create, publish, and grading workflow

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Teacher Exams (`/teacher/exams`)

**Files:**
- Create: `app/(school)/teacher/exams/page.tsx`

- [ ] **Step 1: Create teacher exams page**

Use `frontend-design` skill. Three tabs: My Exams, Question Bank, Enter Marks.

Same as admin exams but filtered to teacher's subjects:
- My Exams: exam cards filtered by teacher's subject_ids, can create exams
- Question Bank: filtered to teacher's subjects, full CRUD + verify
- Enter Marks: select exam from teacher's exams, spreadsheet grid for marks entry

Reuses hooks from `hooks/use-exams.ts`. Filter logic: compare exam's subject_id against `useMySubjects(teacherId)`.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/exams/"
git commit -m "feat(b2): add Teacher Exams page with exam cards, question bank, marks entry

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Teacher Gradebook (`/teacher/gradebook`)

**Files:**
- Create: `app/(school)/teacher/gradebook/page.tsx`

- [ ] **Step 1: Create teacher gradebook page**

Use `frontend-design` skill. Four tabs: Marks Entry, Internal Marks, Grade Scales, Report Cards.

- Marks Entry: same spreadsheet grid as admin, pre-filtered to teacher's sections/subjects
- Internal Marks (NEW): section selector → grid with students as rows, assessment categories as columns (Classwork, Homework, Project, Lab Work). Inline editable marks. Save calls `POST /api/v1/internal-marks`
- Grade Scales: read-only expandable list
- Report Cards: read-only view for teacher's students, can view/download PDFs but not generate/publish

Reuses hooks from `hooks/use-gradebook.ts` and `hooks/use-exams.ts`. Needs new hooks for internal marks:
- Add to the page directly or create inline: `api.get("/api/v1/internal-marks?section_id=X")` and `api.post("/api/v1/internal-marks", data)`

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/gradebook/"
git commit -m "feat(b2): add Teacher Gradebook with marks entry, internal marks, report cards

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: AI Assistant (`/teacher/ai-assistant`)

**Files:**
- Create: `hooks/use-ai-assistant.ts`
- Create: `app/(school)/teacher/ai-assistant/page.tsx`

**THIS IS THE SIGNATURE PAGE — use `frontend-design` skill with explicit instruction for premium, product-grade design.**

- [ ] **Step 1: Create AI assistant hooks**

Create `hooks/use-ai-assistant.ts`:

```typescript
"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useGenerateLessonPlan() {
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      chapter: string;
      topic: string;
      duration_minutes: number;
      class_level: number;
      board: string;
    }) => {
      // Use the tutor session flow: create session then send message requesting lesson plan
      const session = await api.post<any>("/api/v1/tutor/sessions", {
        subject: data.subject,
        concept_name: data.topic,
      });
      const sessionId = session?.data?.id ?? session?.id;
      const message = `Generate a detailed lesson plan for teaching "${data.topic}" from chapter "${data.chapter}" in ${data.subject} for Class ${data.class_level} (${data.board}). Duration: ${data.duration_minutes} minutes. Include: Learning Objectives, Warm-up Activity, Main Lesson, Practice Activity, Assessment, and Homework. Format with clear section headers.`;
      const response = await api.post<any>(`/api/v1/tutor/sessions/${sessionId}/messages`, {
        content: message,
      });
      return {
        text: response?.data?.response_text ?? response?.response_text ?? "",
        session_id: sessionId,
        tokens_used: response?.data?.tokens_used ?? response?.tokens_used ?? 0,
        model_used: response?.data?.model_used ?? response?.model_used ?? "",
      };
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: (data: {
      subject: string;
      chapter: string;
      topic: string;
      question_type: string;
      count: number;
      difficulty: string;
      class_level: number;
      marks_per_question: number;
    }) => api.post<any>("/api/v1/content/generate-questions", data),
    onError: (err: Error) => toast.error(err.message),
  });
}
```

Note: The quiz endpoint may not exist as a frontend proxy yet. If `/api/v1/content/generate-questions` doesn't exist in the Rust backend, the implementer should check the backend routes and either use a similar existing endpoint or note this as a DONE_WITH_CONCERNS.

- [ ] **Step 2: Create AI assistant page**

Use `frontend-design` skill with this explicit direction: "This is the signature page of an AI-powered education SaaS product. It should feel magical, premium, and distinctive — not like a generic admin tool. Use creative gradients, glass morphism, subtle sparkle effects, streaming text animations for AI output, and polished micro-interactions. The design should make a school principal say 'wow' in a demo."

Page structure:
- PageHeader with gradient text "AI Assistant" and sparkle icon
- Tool card grid (2x2): Lesson Planner (active, purple gradient), Quiz Generator (active, green gradient), Class Insights (coming soon, muted), Content Summarizer (coming soon, muted)
- Active tool expands below cards with form inputs:
  - **Lesson Planner**: subject select, chapter select, topic select (cascading from teacher's subjects via `useMySubjects`/`useChapters`/`useTopics`), duration input, class level, board
  - **Quiz Generator**: same subject/chapter/topic cascade, question_type multi-select, difficulty select, count slider (1-20), marks_per_question
- Generate button with loading spinner
- Result panel: AI badge, structured text output, Copy/Download/Print/Regenerate actions
- For quiz results: question cards with answers, "Add All to Question Bank" bulk action (calls `useCreateQuestion` from `hooks/use-exams.ts` for each)

- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

```bash
git add hooks/use-ai-assistant.ts "app/(school)/teacher/ai-assistant/"
git commit -m "feat(b2): add AI Assistant page with lesson planner and quiz generator

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Student Insights (`/teacher/insights`)

**Files:**
- Create: `hooks/use-student-insights.ts`
- Create: `app/(school)/teacher/insights/page.tsx`

- [ ] **Step 1: Create student insights hooks**

Create `hooks/use-student-insights.ts`:

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useStudentMastery(studentId?: string) {
  return useQuery({
    queryKey: ["student-mastery", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/mastery`),
    enabled: !!studentId,
  });
}

export function useStudentGradebook(studentId?: string) {
  return useQuery({
    queryKey: ["student-gradebook", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/gradebook`),
    enabled: !!studentId,
  });
}

export function useStudentAttendance(studentId?: string) {
  return useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/attendance`),
    enabled: !!studentId,
  });
}

export function useStudentReportCards(studentId?: string) {
  return useQuery({
    queryKey: ["student-report-cards", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/report-cards`),
    enabled: !!studentId,
  });
}

export function useTutorSessions() {
  return useQuery({
    queryKey: ["tutor-sessions"],
    queryFn: () => api.get<any>("/api/v1/tutor/sessions"),
  });
}

export function useTutorSessionMessages(sessionId?: string) {
  return useQuery({
    queryKey: ["tutor-sessions", sessionId, "messages"],
    queryFn: () => api.get<any>(`/api/v1/tutor/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
  });
}
```

- [ ] **Step 2: Create student insights page**

Use `frontend-design` skill.

Layout: class-section dropdown → student selector → insight panels

When student selected, show insight panels:
1. **Mastery Heatmap**: Concept mastery grid — each concept as a small colored cell (red < 40%, yellow 40-70%, green > 70%). Data from `useStudentMastery`.
2. **Performance Trend**: Recharts `LineChart` of exam scores over time from `useStudentGradebook`.
3. **Attendance Summary**: Donut chart or stat cards — present/absent/late counts and percentage from `useStudentAttendance`.
4. **AI Tutor Sessions**: List of tutor sessions from `useTutorSessions()` filtered to student. Each: topic, message count, rating stars, date. Click to expand → show conversation messages.
5. **Recommendations**: Derived from mastery data — "Needs help with: {concepts below 50% mastery}". Simple alert cards.

Empty state when no student selected.

- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

```bash
git add hooks/use-student-insights.ts "app/(school)/teacher/insights/"
git commit -m "feat(b2): add Student Insights page with mastery heatmap, performance trends, tutor history

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Teacher Announcements (`/teacher/announcements`)

**Files:**
- Create: `app/(school)/teacher/announcements/page.tsx`

- [ ] **Step 1: Create teacher announcements page**

Use `frontend-design` skill. Same as admin announcements page but:
- Can create class/section-scoped announcements only (no school-wide)
- Scope radio: only "class" and "section" options
- Target selectors show only teacher's assigned classes/sections
- Can view school-wide announcements (read-only) in the list but create button only allows class/section scope
- School-wide announcements shown with a "School" badge and no edit/delete controls

Reuses hooks from `hooks/use-announcements.ts`.

- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add "app/(school)/teacher/announcements/"
git commit -m "feat(b2): add Teacher Announcements page scoped to assigned classes

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Notifications hooks + page (`/teacher/notifications`)

**Files:**
- Create: `hooks/use-notifications.ts`
- Create: `app/(school)/teacher/notifications/page.tsx`

- [ ] **Step 1: Create notifications hooks**

Create `hooks/use-notifications.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any>("/api/v1/admin/notifications"),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/v1/admin/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create notifications page**

Use `frontend-design` skill.

- PageHeader: "Notifications" + "Mark All Read" button
- Notification list sorted by date (newest first)
- Each item: notification type icon (info/warning/success mapped to lucide icons), title (bold if unread), message body, timestamp (formatRelativeTime), read/unread dot indicator
- Click notification → marks as read via `useMarkNotificationRead`
- Unread items: slightly highlighted background
- Empty state: "No notifications"
- Unread count shown in a badge

- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

```bash
git add hooks/use-notifications.ts "app/(school)/teacher/notifications/"
git commit -m "feat(b2): add Notifications page with read/unread management

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Final verification and cleanup

- [ ] **Step 1: Full build verification**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`
Expected: Build succeeds with all 12 new teacher routes compiled

- [ ] **Step 2: Verify all routes in build output**

Confirm these routes appear:
```
/teacher/dashboard
/teacher/classes
/teacher/attendance
/teacher/timetable
/teacher/content
/teacher/assignments
/teacher/exams
/teacher/gradebook
/teacher/ai-assistant
/teacher/announcements
/teacher/insights
/teacher/notifications
```

- [ ] **Step 3: Push branch**

```bash
git push -u origin feature/b2-teacher-dashboard
```
