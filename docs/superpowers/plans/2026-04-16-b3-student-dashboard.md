# B3: Student Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 11 Student Dashboard pages with online exam mode, AI Tutor chat, progress analytics, and student self-service features.

**Architecture:** All pages under `app/(school)/student/` using existing SchoolLayout. A shared `useStudentContext` hook provides student identity and section. Pages heavily reuse existing hooks (content, assignments, exams, gradebook, announcements, notifications, timetable). New hooks for student-specific features (exam attempts, tutor sessions). The AI Tutor page uses warm cream theme. The exam page includes a fullscreen immersive mode. Use `frontend-design` skill for all page implementations — premium SaaS product quality.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Framer Motion, Lucide, Recharts, sonner

**Spec:** `docs/superpowers/specs/2026-04-16-b3-student-dashboard-design.md`

**Branch:** `feature/b3-student-dashboard`

**IMPORTANT for implementers:** Use the `frontend-design` skill. Premium product quality throughout. The AI Tutor page specifically uses a warm cream theme (#FEFCF9 background, cream borders #f0ebe3, indigo accents). Use `extractArray` from `@/lib/utils` (already exists) for data extraction.

---

### Task 1: Student context hook + nav update + new hooks

**Files:**
- Create: `hooks/use-student-context.ts`
- Create: `hooks/use-student-exam.ts`
- Create: `hooks/use-tutor.ts`
- Modify: `hooks/use-assignments.ts` (add submit mutation)
- Modify: `lib/school-nav.ts` (update STUDENT_NAV)

- [ ] **Step 1: Create student context hook**

Create `hooks/use-student-context.ts`:

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/lib/store";

export function useStudentProfile() {
  const user = useUserStore((s) => s.user);
  const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.username;
  return useQuery({
    queryKey: ["student-profile", userId],
    queryFn: async () => {
      // No /students/me endpoint; fetch first page and match by auth_user_id
      const data = await api.get<any>("/api/v1/students?per_page=100");
      const students = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      return students.find((s: any) =>
        s.auth_user_id === userId ||
        s.user_id === userId ||
        String(s.auth_user_id) === String(userId)
      ) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Create student exam hooks**

Create `hooks/use-student-exam.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useStartAttempt() {
  return useMutation({
    mutationFn: ({ examId, studentId }: { examId: string; studentId: string }) =>
      api.post<any>(`/api/v1/exams/${examId}/attempt`, { student_id: studentId }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAttempt(attemptId?: string) {
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => api.get<any>(`/api/v1/attempts/${attemptId}`),
    enabled: !!attemptId,
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: string; data: any }) =>
      api.post(`/api/v1/attempts/${attemptId}/answer`, data),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      api.post(`/api/v1/attempts/${attemptId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam submitted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecordViolation() {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: string; data: any }) =>
      api.post(`/api/v1/attempts/${attemptId}/violation`, data),
  });
}
```

- [ ] **Step 3: Create tutor hooks**

Create `hooks/use-tutor.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useTutorSessions() {
  return useQuery({
    queryKey: ["tutor-sessions"],
    queryFn: () => api.get<any>("/api/v1/tutor/sessions"),
  });
}

export function useCreateTutorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>("/api/v1/tutor/sessions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-sessions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTutorSession(id?: string) {
  return useQuery({
    queryKey: ["tutor-sessions", id],
    queryFn: () => api.get<any>(`/api/v1/tutor/sessions/${id}`),
    enabled: !!id,
  });
}

export function useTutorMessages(sessionId?: string) {
  return useQuery({
    queryKey: ["tutor-messages", sessionId],
    queryFn: () => api.get<any>(`/api/v1/tutor/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

export function useSendTutorMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      api.post<any>(`/api/v1/tutor/sessions/${sessionId}/messages`, { content }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tutor-messages", variables.sessionId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRateSession() {
  return useMutation({
    mutationFn: ({ sessionId, rating }: { sessionId: string; rating: number }) =>
      api.post(`/api/v1/tutor/sessions/${sessionId}/rate`, { rating }),
    onSuccess: () => toast.success("Thanks for your feedback!"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/api/v1/tutor/sessions/${sessionId}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-sessions"] });
      toast.success("Session closed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 4: Add submit mutation to use-assignments.ts**

Add to `hooks/use-assignments.ts`:

```typescript
export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: any }) =>
      api.post(`/api/v1/assignments/${assignmentId}/submit`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Assignment submitted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 5: Update student nav**

Replace `STUDENT_NAV` in `lib/school-nav.ts`:

```typescript
export const STUDENT_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/student/dashboard", icon: "LayoutDashboard" },
    { name: "My Classes", href: "/student/classes", icon: "BookOpen" },
  ]},
  { section: "LEARNING", items: [
    { name: "Content", href: "/student/content", icon: "PlayCircle" },
    { name: "Assignments", href: "/student/assignments", icon: "PenTool" },
    { name: "Exams", href: "/student/exams", icon: "FileText" },
    { name: "Timetable", href: "/student/timetable", icon: "Calendar" },
  ]},
  { section: "AI & PROGRESS", items: [
    { name: "AI Tutor", href: "/student/tutor", icon: "Brain" },
    { name: "My Progress", href: "/student/progress", icon: "TrendingUp" },
    { name: "Report Cards", href: "/student/report-cards", icon: "Award" },
  ]},
  { section: "COMMUNICATION", items: [
    { name: "Announcements", href: "/student/announcements", icon: "Megaphone" },
    { name: "Notifications", href: "/student/notifications", icon: "Bell" },
  ]},
];
```

- [ ] **Step 6: Verify build and commit**

```bash
cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build
git add hooks/use-student-context.ts hooks/use-student-exam.ts hooks/use-tutor.ts hooks/use-assignments.ts lib/school-nav.ts
git commit -m "feat(b3): add student context, exam, tutor hooks and update nav

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Student Dashboard + My Classes

**Files:**
- Create: `app/(school)/student/dashboard/page.tsx`
- Create: `app/(school)/student/classes/page.tsx`

- [ ] **Step 1: Create student dashboard**

Premium design. Structure:
- Welcome banner: "Hey, {student.first_name}!" with date, warm gradient
- 4 KPI cards: Attendance %, Mastery %, Pending Assignments, Upcoming Exams
- Upcoming section: next 3 due assignments/exams with countdown
- Quick actions: Continue Learning, Submit Assignment, AI Tutor, My Progress

Data: `useStudentProfile()`, `useStudentAttendance(studentId)` from `hooks/use-student-insights.ts`, `useSectionAssignments(sectionId)` from `hooks/use-assignments.ts`

- [ ] **Step 2: Create my classes page**

Card grid of student's enrolled subjects. Data: `useSubjects()` from `hooks/use-academic.ts`, `useChapters(subjectId)` from `hooks/use-content.ts`. Each card: subject name, chapter progress, mastery bar. Click → expand to show chapters with topic progress.

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add "app/(school)/student/dashboard/" "app/(school)/student/classes/"
git commit -m "feat(b3): add Student Dashboard and My Classes pages

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Content Browser + Assignments

**Files:**
- Create: `app/(school)/student/content/page.tsx`
- Create: `app/(school)/student/assignments/page.tsx`

- [ ] **Step 1: Create content browser**

Same tree sidebar + detail panel as teacher content but READ-ONLY:
- No CRUD buttons, no upload
- Filtered to student's class subjects (use `useSubjects()` — backend scopes by org)
- Progress indicators per topic (percentage bar)
- Click learning object → inline viewer (PDF embed via `<object>`, video via `<video>`, image via `<img>`)
- Track progress on view: call `api.post(\`/api/v1/learning-objects/${id}/progress\`, { student_id, progress_percent, time_spent_seconds })`

Hooks: `useChapters`, `useTopics`, `useLearningObjects` from `hooks/use-content.ts`. `useStudentProfile` for student_id.

- [ ] **Step 2: Create assignments page**

Assignment list for student's section:
- Cards: title, subject, due date, status badge (pending=amber, submitted=blue, graded=green, late=red), marks if graded
- Submit flow: click assignment → view description → textarea for response + file upload → submit button
- Uses `useSectionAssignments(sectionId)`, `useSubmitAssignment()` from `hooks/use-assignments.ts`
- Student ID from `useStudentProfile()`

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add "app/(school)/student/content/" "app/(school)/student/assignments/"
git commit -m "feat(b3): add Content Browser (read-only with progress) and Assignments (submit)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Online Exam UI (fullscreen immersive)

**Files:**
- Create: `app/(school)/student/exams/page.tsx`

**THIS IS A COMPLEX PAGE with two modes: exam list + fullscreen exam.**

- [ ] **Step 1: Create exams page with both modes**

Premium design. The page has TWO VIEWS controlled by state:

**View 1 — Exam List (default):**
- Cards of exams for student's section (from `useExams()` filtered by section)
- Each: name, subject, date, duration, marks, status badge
- "Start Exam" button on upcoming/published exams
- Completed exams show score + grade

**View 2 — Fullscreen Exam Mode (when `activeAttempt` is set):**

On "Start Exam" click:
1. Call `useStartAttempt({ examId, studentId })` → get attempt
2. Request fullscreen: `document.documentElement.requestFullscreen()`
3. Switch to exam mode view

**Exam mode layout:**
- Dark navy sidebar (64px, `bg-[#1E1B4B]`): question dots in vertical column
  - Colors: `bg-indigo-500` = current, `bg-emerald-500` = answered, `bg-amber-500` = flagged, `bg-white/10` = unanswered
  - Status summary at bottom: answered/flagged/unanswered counts
- Top bar: exam name + section label | Timer (monospace, large, pulses red < 5min) | violation counter
- Main area: question number label, question text, answer input (varies by type — see below)
- Footer: Previous/Next buttons, Flag button, Clear button, Submit Exam button

**Answer types (render based on `question_type`):**
- `mcq`: 4 option cards (A/B/C/D), click to select, selected = indigo bg
- `short_answer`: textarea (4 rows)
- `long_answer`: textarea (8 rows)
- `true_false`: two toggle cards (True/False)
- `fill_blank`: input field
- `match_following`: two-column with select dropdowns to match
- `assertion_reason`: option cards with A&R text

**Timer logic:**
```typescript
const [timeLeft, setTimeLeft] = useState(durationSeconds);
useEffect(() => {
  if (timeLeft <= 0) { handleSubmit(); return; }
  const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
  return () => clearTimeout(t);
}, [timeLeft]);
```

**Anti-cheat:**
```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      setViolations(v => v + 1);
      recordViolation.mutate({ attemptId, data: { violation_type: "tab_switch" } });
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}, [attemptId]);
```

**Auto-save:** Debounce `useSaveAnswer()` calls — save answer 1 second after student stops typing/clicking.

**Submit:** Confirmation dialog showing unanswered count, then `useSubmitAttempt(attemptId)`, exit fullscreen, return to exam list.

Hooks: `useExams` from `hooks/use-exams.ts`, `useStartAttempt`, `useAttempt`, `useSaveAnswer`, `useSubmitAttempt`, `useRecordViolation` from `hooks/use-student-exam.ts`. `useStudentProfile` for student_id.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add "app/(school)/student/exams/"
git commit -m "feat(b3): add Online Exam page with fullscreen immersive mode and anti-cheat

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: AI Tutor Chat (warm cream theme)

**Files:**
- Create: `app/(school)/student/tutor/page.tsx`

**THE SIGNATURE STUDENT PAGE — warm cream design.**

- [ ] **Step 1: Create AI tutor page**

**DESIGN DIRECTION:** Warm cream background (#FEFCF9), cream borders (#f0ebe3), white message bubbles with soft shadows, indigo user bubbles with glow, amber hint cards, warm input area. Cozy study room aesthetic. NOT dark theme.

**Layout: Chat-first + collapsible context sidebar**

**Chat area (main, flex-1):**
- Header: tutor avatar (indigo gradient rounded square, 🧠), "EduPulse AI Tutor", online status dot, session info
- Messages area: scrollable, auto-scroll on new messages
  - AI bubbles: white bg, cream border, left-aligned, `border-radius: 4px 18px 18px 18px`
  - Student bubbles: indigo gradient, right-aligned, `border-radius: 18px 4px 18px 18px`
  - Hint cards: amber gradient bg (#FFF7ED → #FFFBEB), amber border, light bulb prefix
  - Message metadata: timestamp, exchange count
- Quick-action chips: "Explain differently", "Practice problems", "Solved example", "Related topics"
- Input area: cream bg input, indigo send button with hover scale

**Context sidebar (260px, collapsible):**
- Your Mastery: bars from `useStudentMastery(studentId)` — red/amber/green by level
- Related Content: learning object links from `useLearningObjects(topicId)` — icon + title + type
- Prerequisites: amber alert if concept prerequisites have < 50% mastery

**Session flow:**
1. On mount: create session via `useCreateTutorSession({ subject, concept_name })` or resume latest
2. Load messages via `useTutorMessages(sessionId)`
3. Send message → `useSendTutorMessage({ sessionId, content })`
4. After AI responds, refetch messages
5. Rate button → `useRateSession({ sessionId, rating })`
6. End session → `useCloseSession(sessionId)`

**State:**
```typescript
const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
const [inputValue, setInputValue] = useState("");
const [sidebarOpen, setSidebarOpen] = useState(true);
```

Hooks: `useStudentProfile` from `hooks/use-student-context.ts`. All tutor hooks from `hooks/use-tutor.ts`. `useStudentMastery` from `hooks/use-student-insights.ts`. `useLearningObjects` from `hooks/use-content.ts`.

Framer Motion: message slide-in animation, typing indicator (3 bouncing dots), mastery bars animate on load, sidebar expand/collapse spring.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add "app/(school)/student/tutor/"
git commit -m "feat(b3): add AI Tutor chat page with warm cream theme and Socratic dialogue

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: My Progress page

**Files:**
- Create: `app/(school)/student/progress/page.tsx`

- [ ] **Step 1: Create progress analytics page**

Premium design with Recharts.

**Sections:**
1. **Overall Mastery**: Large circular/radial progress (use a styled div or Recharts RadialBarChart), percentage in center, trend arrow
2. **Concept Mastery Heatmap**: Grid of concept cells from `useStudentMastery`. Each: concept name, colored by level (red < 40%, amber 40-70%, green > 70%). Animate from gray → colored on load.
3. **Grade Trends**: Recharts `AreaChart` with gradient fill — exam scores over time from `useStudentGradebook`
4. **Subject Breakdown**: Bar chart or card grid showing mastery per subject
5. **Attendance Trend**: Small Recharts `AreaChart` of monthly attendance from `useStudentAttendance`
6. **Recent Activity**: Timeline of learning events (could be derived from tutor sessions + content progress)

Hooks: `useStudentProfile`, `useStudentMastery`, `useStudentGradebook`, `useStudentAttendance` from `hooks/use-student-insights.ts`.

Import from recharts: `AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar`

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add "app/(school)/student/progress/"
git commit -m "feat(b3): add My Progress page with mastery heatmap, grade trends, attendance chart

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Timetable + Announcements + Report Cards + Notifications

**Files:**
- Create: `app/(school)/student/timetable/page.tsx`
- Create: `app/(school)/student/announcements/page.tsx`
- Create: `app/(school)/student/report-cards/page.tsx`
- Create: `app/(school)/student/notifications/page.tsx`

These are 4 simpler pages that heavily reuse existing hooks and patterns.

- [ ] **Step 1: Create student timetable**

Read-only weekly grid for student's section:
- Auto-loads student's `current_section_id` from `useStudentProfile()`
- No selectors — single section view
- Grid: rows = periods, columns = Mon-Sat
- Cells: subject + teacher name, color-coded
- Break rows as separators
- Current day/period highlighted
- Reuses `usePeriodDefinitions()`, `useSectionTimetable(sectionId)` from `hooks/use-timetable.ts`

- [ ] **Step 2: Create student announcements**

Read-only announcement card list:
- Shows all announcements (school-wide + student's class + section)
- Each card: title, body preview, scope badge, date
- Click → view full announcement
- Acknowledge button if `requires_ack` → calls `api.post(\`/api/v1/announcements/${id}/ack\`)`
- No create/edit — read-only
- Reuses `useAnnouncements()` from `hooks/use-announcements.ts`

- [ ] **Step 3: Create report cards page**

Report card list with PDF viewer:
- List from `useStudentReportCards(studentId)` (from `hooks/use-gradebook.ts`)
- Each row: exam/term name, date, status badge
- "View" button → dialog with `<object>` PDF viewer using blob URL
- "Download" button → open in new tab
- Empty state if none generated
- Student ID from `useStudentProfile()`

- [ ] **Step 4: Create student notifications**

Same pattern as teacher notifications:
- Reuses `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` from `hooks/use-notifications.ts`
- List with read/unread indicators, mark read on click, mark all read button
- Type-based icons

- [ ] **Step 5: Build and commit each**

```bash
npm run build

git add "app/(school)/student/timetable/"
git commit -m "feat(b3): add Student Timetable page (read-only weekly view)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git add "app/(school)/student/announcements/"
git commit -m "feat(b3): add Student Announcements page (read-only with acknowledge)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git add "app/(school)/student/report-cards/"
git commit -m "feat(b3): add Student Report Cards page with PDF viewer

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git add "app/(school)/student/notifications/"
git commit -m "feat(b3): add Student Notifications page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Final verification and push

- [ ] **Step 1: Full build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

Verify all 11 student routes in output:
```
/student/dashboard
/student/classes
/student/content
/student/assignments
/student/exams
/student/tutor
/student/progress
/student/timetable
/student/announcements
/student/report-cards
/student/notifications
```

- [ ] **Step 2: Push**

```bash
git push -u origin feature/b3-student-dashboard
```
