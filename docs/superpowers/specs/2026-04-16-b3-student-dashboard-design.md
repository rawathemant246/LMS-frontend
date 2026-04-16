# B3: Student Dashboard — Design Spec

## Goal

Build 8 Student Dashboard pages — student's learning hub with content browsing, assignment submission, online exams, AI Tutor chat, and progress tracking.

## Context

- **Existing**: 15 Admin pages + 12 Teacher pages built
- **Backend APIs**: All routes exist (content, assignments, exams, tutor, mastery, gradebook)
- **Design quality**: Use `frontend-design` skill. Light theme throughout — warm cream (#FEFCF9) with indigo accents for the AI Tutor. Standard light theme for other pages matching the school admin aesthetic but with student-friendly polish.
- **Student nav** already defined in `lib/school-nav.ts`

## Tech Stack

Same as B2: Next.js 15, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Framer Motion, Lucide, Recharts, sonner

## Architecture: Student Context

Students see only their own data. Determined by:
1. JWT `sub` → user_id → `GET /api/v1/students` → find student profile matching auth_user_id
2. Student's `current_class_id` and `current_section_id` → scope content, assignments, exams

Create a shared hook `hooks/use-student-context.ts`:
```
useStudentProfile() — finds and caches student profile for current user
useMySection() — derived: student's current section
useMyClass() — derived: student's current class
```

---

## Page 1: Student Dashboard (`/student/dashboard`)

**Layout**: Welcome banner + KPI cards + upcoming schedule + quick actions

**Welcome banner**: "Hey, {student.first_name}!" with today's date, warm gradient

**KPI cards** (4):
- Attendance % (this term)
- Overall Mastery % (average across concepts)
- Pending Assignments (due but not submitted)
- Upcoming Exams (scheduled, not yet taken)

**Upcoming section**: Next 3 assignments/exams due, sorted by date. Each shows title, subject, due date, countdown.

**Quick actions**: Continue Learning (→ content), Submit Assignment (→ assignments), AI Tutor (→ tutor), My Progress (→ progress)

**API hooks**: `useStudentProfile`, student attendance, assignments, exams

---

## Page 2: My Classes (`/student/classes`)

**Layout**: Cards showing student's enrolled subjects for their current class-section

Each card: subject name, teacher name, chapter progress (X of Y chapters completed), mastery bar

Click card → shows chapters list with topic-level progress indicators

**API hooks**: `useSubjects`, `useChapters`, content progress data

---

## Page 3: Content Browser (`/student/content`)

**Layout**: Subject → Chapter → Topic browsable tree with learning object viewer

Same tree structure as teacher content page but:
- Read-only — no CRUD, no upload
- Filtered to student's class subjects
- Shows progress indicators per topic (percentage completed)
- Click learning object → inline viewer (PDF embed, video player, image lightbox)
- Track progress: `POST /api/v1/learning-objects/{id}/progress` on view/completion

**API hooks**: Reuses `useChapters`, `useTopics`, `useLearningObjects` from `hooks/use-content.ts`

---

## Page 4: Assignments (`/student/assignments`)

**Layout**: List of assignments for student's section with submission UI

**Assignment list**: Cards showing title, subject, due date, status (pending/submitted/graded/late), marks (if graded)

**Submit flow**: Click assignment → view description + attachments → submit response:
- Text response textarea
- File upload for attachments
- Submit button → `POST /api/v1/assignments/{id}/submit` with `student_id`

**Status badges**: pending=amber, submitted=blue, graded=green, late=red

**API hooks**:
- `useSectionAssignments(sectionId)` from `hooks/use-assignments.ts`
- New: `useSubmitAssignment()` → `POST /api/v1/assignments/{id}/submit`

---

## Page 5: Online Exam UI (`/student/exams`)

**TWO VIEWS:**

### View 1: Exam List
- Cards of available/upcoming exams for student's section
- Each: exam name, subject, date, duration, total marks, status (upcoming/in_progress/completed/results_declared)
- "Start Exam" button on upcoming exams → enters fullscreen exam mode

### View 2: Fullscreen Exam Mode (CHOSEN DESIGN: Immersive)

**Layout**: Fullscreen immersive UI with dark question nav sidebar

**Left sidebar (64px, dark navy #1E1B4B)**:
- Question dots in a vertical column
- Color-coded: green=answered, amber=flagged, gray=unanswered, indigo=current
- Status summary at bottom: answered/flagged/unanswered counts

**Top bar**:
- Exam name + current section label
- Timer (large, monospace) — pulses red when < 5 minutes remaining
- Violation counter (tab switches detected)
- Calculator button (optional tool)

**Main content area**:
- Question number + "of N" label
- Question text (full width, good typography)
- Answer area depends on question type:
  - MCQ: option cards (A/B/C/D) — click to select, selected gets indigo highlight
  - Short answer: textarea
  - Long answer: large textarea
  - True/False: two toggle cards
  - Fill in blank: inline input
  - Match following: two-column drag or select matching
  - Assertion/Reason: option cards with assertion+reason text

**Footer navigation**:
- Previous / Next buttons
- Flag button (marks for review)
- Clear selection button
- Submit Exam button (with confirmation dialog: "Are you sure? X questions unanswered")

**Anti-cheat features**:
- Request fullscreen on exam start (`document.documentElement.requestFullscreen()`)
- Detect tab switch via `visibilitychange` event → record violation (`POST /api/v1/attempts/{id}/violation`)
- Detect fullscreen exit → warning dialog
- Violation counter displayed in top bar

**Flow**:
1. Click "Start Exam" → `POST /api/v1/exams/{id}/attempt` → get attempt ID
2. Load questions from attempt data
3. Save answers as student types → `POST /api/v1/attempts/{id}/answer` (debounced auto-save)
4. Submit → `POST /api/v1/attempts/{id}/submit`
5. On timer expire → auto-submit

**API hooks** (`hooks/use-student-exam.ts`):
- `useStartAttempt()` → `POST /api/v1/exams/{id}/attempt`
- `useAttempt(id)` → `GET /api/v1/attempts/{id}`
- `useSaveAnswer()` → `POST /api/v1/attempts/{id}/answer`
- `useSubmitAttempt()` → `POST /api/v1/attempts/{id}/submit`
- `useRecordViolation()` → `POST /api/v1/attempts/{id}/violation`

---

## Page 6: AI Tutor (`/student/tutor`)

**THE SIGNATURE STUDENT PAGE — premium design, warm cream theme**

**Layout**: Chat-first with expandable context sidebar

**Design**: Warm cream background (#FEFCF9) with indigo message bubbles, cream borders (#f0ebe3), soft shadows. Cozy study room feel.

**Chat area (main)**:
- Header: tutor avatar (gradient indigo rounded square, brain emoji), "EduPulse AI Tutor", online status, session info
- Message bubbles: AI = white with cream border (left-aligned), Student = indigo gradient (right-aligned)
- Hint cards: warm amber background with light bulb icon, explains Socratic method
- Message metadata: timestamp, exchange count, model used
- Quick-action chips below messages: "Explain differently", "Practice problems", "Solved example", "Related topics"
- Input area: cream background input with indigo send button

**Context sidebar (260px, collapsible)**:
- **Your Mastery**: concept mastery bars (red < 40%, amber 40-70%, green > 70%) from `GET /students/{id}/mastery`
- **Related Content**: learning objects relevant to current topic — click to open in new tab
- **Prerequisites**: alert card if prerequisite concepts have low mastery — "Gap detected: Divisibility Rules (38%)"
- Collapse/expand toggle for mobile

**Session flow**:
1. Student visits page → `POST /api/v1/tutor/sessions` (creates or resumes session)
2. Load existing messages via `GET /api/v1/tutor/sessions/{id}/messages`
3. Student types → `POST /api/v1/tutor/sessions/{id}/messages`
4. AI responds (Socratic method with progressive hints based on exchange_count)
5. Rate session → `POST /api/v1/tutor/sessions/{id}/rate`
6. Close session → `POST /api/v1/tutor/sessions/{id}/close`

**API hooks** (`hooks/use-tutor.ts`):
- `useTutorSessions()` → `GET /api/v1/tutor/sessions`
- `useCreateTutorSession()` → `POST /api/v1/tutor/sessions`
- `useTutorSession(id)` → `GET /api/v1/tutor/sessions/{id}`
- `useTutorMessages(sessionId)` → `GET /api/v1/tutor/sessions/{id}/messages`
- `useSendTutorMessage()` → `POST /api/v1/tutor/sessions/{id}/messages`
- `useRateSession()` → `POST /api/v1/tutor/sessions/{id}/rate`
- `useCloseSession()` → `POST /api/v1/tutor/sessions/{id}/close`
- `useStudentMastery(studentId)` → reuse from `hooks/use-student-insights.ts`

**Framer Motion**: Message slide-in animation, typing indicator pulse, mastery bar animate on load, sidebar expand/collapse with spring.

---

## Page 7: My Progress (`/student/progress`)

**Layout**: Progress analytics dashboard

**Sections**:
1. **Overall Mastery**: Large circular progress indicator with percentage, trend arrow
2. **Concept Mastery Heatmap**: Grid of concept cells, colored by mastery level. Click concept → shows detail with learning path
3. **Grade Trends**: Recharts LineChart of exam scores over time
4. **Subject-wise Breakdown**: Bar chart or card grid showing mastery per subject
5. **Attendance Trend**: Small area chart showing attendance over months
6. **Recent Activity**: Timeline of recent learning events (content viewed, assignments submitted, exams taken)

**API hooks**:
- `useStudentMastery(studentId)` from `hooks/use-student-insights.ts`
- `useStudentGradebook(studentId)` from `hooks/use-student-insights.ts`
- `useStudentAttendance(studentId)` from `hooks/use-student-insights.ts`

---

## Page 8: Student Exams Results (embedded in exams page)

After exam completion, students see their results:
- Score breakdown per section
- Grade
- Question-wise marks (for graded questions)
- Teacher feedback (if any)

This is a sub-view of the exams page, not a separate route.

---

## File Structure

```
app/(school)/student/
  dashboard/page.tsx          ← NEW
  classes/page.tsx            ← NEW
  content/page.tsx            ← NEW
  assignments/page.tsx        ← NEW
  exams/page.tsx              ← NEW (includes fullscreen exam mode)
  tutor/page.tsx              ← NEW (premium warm cream design)
  progress/page.tsx           ← NEW

hooks/
  use-student-context.ts      ← NEW
  use-student-exam.ts         ← NEW
  use-tutor.ts                ← NEW
  (reuses: use-content.ts, use-assignments.ts, use-student-insights.ts, use-announcements.ts)
```

## Animations

- All pages: Framer Motion stagger, spring dialogs, tab crossfade
- Exam UI: question transition slide, timer pulse animation, option card selection spring
- AI Tutor: message slide-in, typing indicator, mastery bar animate-on-load
- Progress: chart draw-in, heatmap cells animate from gray → colored
- Content: progress indicators animate as student browses

## Non-Goals

- No peer-to-peer messaging between students
- No discussion forums
- No gamification/badges (future feature)
- No offline exam mode (requires PWA work)
- No video proctoring for exams (violation detection only)
