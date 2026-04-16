# B1c: School Admin Remaining Pages — Design Spec

## Goal

Build the remaining 6 School Admin pages to complete the admin dashboard: Timetable, Content Management, Exams, Gradebook, Announcements, and Settings.

## Context

- **Existing**: Dashboard, Academic Setup, Students (CRUD + detail + CSV import), Teachers (CRUD + detail), Parents (CRUD), Attendance (marking grid + reports), Fees (heads + structures + defaulters) — 9 pages built
- **Backend**: All 126 API routes exist in Rust backend. No new backend work needed.
- **Design System**: Deep Indigo (#4F46E5), Vibrant Orange (#F97316), Navy sidebar (#1E1B4B). shadcn/ui + Tailwind v4. School branding via JSONB.
- **Animations**: Framer Motion throughout — staggered card entry, tab crossfade, spring dialogs, scale-on-press buttons, Magic UI NumberTicker for KPIs. Consistent with existing Super Admin pages.

## Tech Stack

- Next.js 15, TypeScript, Tailwind v4, shadcn/ui
- TanStack Query (data fetching) + TanStack Table (where needed)
- Zustand (school store), Framer Motion (animations), Lucide icons
- Existing hooks pattern: `hooks/use-*.ts` with `useQuery`/`useMutation`
- Existing layout: `app/(school)/admin/*` under `SchoolLayout` with `SchoolSidebar` + `SchoolTopbar`

---

## Page 1: Timetable (`/admin/timetable`)

**Layout**: Split view — period list on left, weekly grid on right.

**Left panel — Period Definitions**:
- Compact list showing each period: label, start time, end time, type (class/break/lunch)
- Break rows highlighted in warm yellow
- "+ Add Period" button at bottom opens a dialog (label, start, end, type dropdown)
- Click existing period to edit inline or via dialog
- Delete with confirmation

**Right panel — Weekly Slot Grid**:
- Class + Section selector dropdowns at top
- Grid: rows = periods (only class-type periods, breaks shown as separator rows), columns = Mon–Sat
- Each cell shows: subject name + teacher name, color-coded by subject
- Click empty cell → dialog to assign (subject dropdown, teacher dropdown)
- Click filled cell → edit or clear assignment
- Subject colors: auto-assigned from a palette (purple for Math, blue for English, green for Science, etc.)

**API hooks** (`hooks/use-timetable.ts`):
- `usePeriodDefinitions()` → `GET /api/v1/period-definitions`
- `useCreatePeriod()` → `POST /api/v1/period-definitions`
- `useSectionTimetable(sectionId)` → `GET /api/v1/sections/{id}/timetable`
- `useCreateSlot()` → `POST /api/v1/timetable-slots`

**Animations**: Staggered row entry for period list, cell hover scale pulse, smooth color transitions on assignment.

---

## Page 2: Content Management (`/admin/content`)

**Layout**: Tree sidebar + detail panel.

**Left panel — Content Tree**:
- Collapsible tree: Subject → Chapter → Topic
- Chevron icons for expand/collapse with height animation
- Active topic highlighted with brand primary background
- "+ Add Chapter" button per subject, "+ Add Topic" button per chapter
- Tree loads subjects on mount, chapters/topics on expand (lazy)

**Right panel — Learning Objects**:
- Breadcrumb trail: `Subject › Chapter › Topic`
- Topic title + description at top
- Learning objects as a sortable list (drag handles for reorder)
- Each item shows: type icon (PDF/Video/Image/Link), title, file size, upload date, status badge (draft/published)
- "+ Upload" button → file picker + metadata dialog (title, type auto-detected from extension)
- Click item → preview (PDF viewer, video player, or image lightbox)
- Reorder saves via `PUT /api/v1/topics/{id}/content-order`

**API hooks** (`hooks/use-content.ts`):
- `useChapters(subjectId)` → `GET /api/v1/subjects/{id}/chapters`
- `useCreateChapter()` → `POST /api/v1/chapters`
- `useTopics(chapterId)` → `GET /api/v1/chapters/{id}/topics`
- `useCreateTopic()` → `POST /api/v1/topics`
- `useLearningObjects(search)` → `GET /api/v1/learning-objects`
- `useCreateLearningObject()` → `POST /api/v1/learning-objects`
- `useUpdateContentOrder()` → `PUT /api/v1/topics/{id}/content-order`

**Animations**: Tree expand/collapse (height + opacity), staggered list items, drag reorder with layout animation.

---

## Page 3: Exams (`/admin/exams`)

**Layout**: Three tabs — Exams, Question Bank, Results.

### Tab 1: Exams
- Card grid of exams with filters (class, subject, status)
- Each card: exam name, class/subject, total marks, duration, date, status badge, action buttons
- Draft exams: Edit Paper, Auto-Generate, Publish buttons
- Published exams: View Paper, Results, Marks Entry buttons
- "+ Create Exam" button opens a dialog:
  - Fields: name, exam_type (unit_test/mid_term/final/practice), subject, class, total_marks, duration_minutes, scheduled_date
  - On create → close dialog, invalidate query, new exam appears in grid

### Tab 2: Question Bank
- Searchable table of questions with filters: subject, chapter, type (mcq/short_answer/long_answer/true_false/fill_blank/match_following/assertion_reason), difficulty, verified status
- Each row: question text (truncated), type badge, difficulty badge, marks, chapter, verified checkmark
- "+ Add Question" dialog: question_text (textarea), question_type, options (dynamic based on type), correct_answer, marks, difficulty, chapter, explanation
- Verify button on each question (marks as verified for exam use)

### Tab 3: Results
- Exam selector dropdown at top
- Once selected: marks entry grid (same spreadsheet pattern as Gradebook)
- "Declare Results" button → publishes results
- Summary stats: class average, highest, lowest, pass%, grade distribution chart

**API hooks** (`hooks/use-exams.ts`):
- `useExams()` → `GET /api/v1/exams`
- `useCreateExam()` → `POST /api/v1/exams`
- `useExam(id)` → `GET /api/v1/exams/{id}`
- `usePublishExam()` → `POST /api/v1/exams/{id}/publish`
- `useAutoGenerate()` → `POST /api/v1/exams/{id}/auto-generate`
- `useExamResults(id)` → `GET /api/v1/exams/{id}/results`
- `useBulkMarks()` → `POST /api/v1/exams/{id}/bulk-marks`
- `useDeclareResults()` → `POST /api/v1/exams/{id}/declare-results`
- `useQuestions(filters)` → `GET /api/v1/questions`
- `useCreateQuestion()` → `POST /api/v1/questions`
- `useVerifyQuestion()` → `POST /api/v1/questions/{id}/verify`

**Animations**: Staggered card entry, tab crossfade, dialog spring scale-in, status badge color pulse on publish.

---

## Page 4: Gradebook (`/admin/gradebook`)

**Layout**: Three tabs — Marks Entry, Grade Scales, Report Cards.

### Tab 1: Marks Entry
- Filter bar: exam selector, class/section selector, subject selector
- Spreadsheet-style grid:
  - Columns: #, Roll No, Student Name, [one column per exam paper section with max marks in header], Total, Grade
  - Rows: one per student, sorted by roll number
  - Section mark cells are inline-editable `<input>` fields
  - Total and Grade auto-calculated on input change
  - Validation: mark cannot exceed section max marks, red highlight for below 40%
  - Class average row at bottom
- "Save All" button → `POST /api/v1/exams/{id}/bulk-marks`
- Tab/Enter navigation between cells

### Tab 2: Grade Scales
- List of grade scales with entries table
- "+ Create Grade Scale" dialog: name, type (percentage/grade_point/marks), entries (label, min%, max%, grade_point, description, sort_order)
- Each scale expandable to show its entries

### Tab 3: Report Cards
- Class/section selector
- "Generate Report Cards" button → `POST /api/v1/report-cards/generate` (generates for entire section)
- "Publish Report Cards" button → `POST /api/v1/report-cards/publish`
- List of students with report card status (generated/published/not_generated)
- "Download PDF" button per student → `GET /api/v1/report-cards/{id}/pdf`
- "View" button → preview in dialog

**API hooks** (`hooks/use-gradebook.ts`):
- `useGradeScales()` → `GET /api/v1/grade-scales`
- `useCreateGradeScale()` → `POST /api/v1/grade-scales`
- `useStudentGradebook(studentId)` → `GET /api/v1/students/{id}/gradebook`
- `useGenerateReportCards()` → `POST /api/v1/report-cards/generate`
- `usePublishReportCards()` → `POST /api/v1/report-cards/publish`
- `useStudentReportCards(studentId)` → `GET /api/v1/students/{id}/report-cards`
- `useReportCardPdf(id)` → `GET /api/v1/report-cards/{id}/pdf`

**Animations**: Row stagger on grid load, cell flash on save, grade badge color transition, report card status transitions.

---

## Page 5: Announcements (`/admin/announcements`)

**Layout**: Standard list + create dialog. Similar to existing CRUD pages.

**List view**:
- Announcement cards in a vertical list (not table — announcements have long body text)
- Each card: title, body preview (2 lines truncated), scope badge (school/class/section), published/draft badge, created date, acknowledgment count if requires_ack
- Filters: scope, published status
- Search by title

**Create/Edit dialog**:
- Fields: title, body (textarea — no rich text editor in v1), scope (radio: school/class/section), target_class_id and target_section_id (shown conditionally based on scope), is_published toggle, requires_ack checkbox
- On publish: published_at set automatically

**API hooks** (`hooks/use-announcements.ts`):
- `useAnnouncements()` → `GET /api/v1/announcements`
- `useCreateAnnouncement()` → `POST /api/v1/announcements`
- `useAnnouncement(id)` → `GET /api/v1/announcements/{id}`

**Animations**: Staggered card entry, slide-in from right on create, fade-out on delete, acknowledgment count ticker.

---

## Page 6: Settings (`/admin/settings`)

**Layout**: Three tabs — School Profile, Branding, Academic Config.

### Tab 1: School Profile
- Form: school name, board (CBSE/ICSE/State), affiliation number, address, phone, email, website, logo upload (with preview)
- Pre-filled from `GET /api/v1/school/profile`
- Save button → `POST /api/v1/school/profile`

### Tab 2: Branding
- Color pickers for: primary color, accent color, sidebar color
- Live preview panel showing a mini sidebar + header with the selected colors
- Logo upload with preview
- Reset to defaults button
- Save persists to school profile branding JSONB

### Tab 3: Academic Config
- Current academic year display (from academic setup)
- Grading system selector (link to Gradebook grade scales)
- Attendance rules: minimum attendance % for eligibility (number input)
- Exam weightage: internal assessment % vs external exam %
- These are stored as school profile JSONB fields

**API hooks**: Reuses `useSchoolProfile()` from `hooks/use-school.ts` + create/update.

**Animations**: Color picker transitions with live preview animation, form save confirmation pulse, tab crossfade.

---

## Shared Animation Patterns

All pages use these consistent Framer Motion patterns:

```
Page entry:        container stagger (delayChildren: 0.1, staggerChildren: 0.05)
Card/row enter:    fadeIn + slideUp (y: 20 → 0, opacity: 0 → 1, duration: 0.3)
Tab content:       crossfade (AnimatePresence mode="wait", opacity transition)
Dialog:            spring scale (scale: 0.95 → 1, opacity: 0 → 1, type: "spring", damping: 25)
Button press:      whileTap={{ scale: 0.97 }}
Hover:             whileHover={{ scale: 1.02 }} on cards, background transition on cells
Badge:             layoutId for shared layout animation on status changes
Delete:            fadeOut + slideLeft (x: 0 → -20, opacity: 1 → 0)
Toast:             slide up from bottom with spring
Number tickers:    Magic UI NumberTicker on KPI values
```

---

## File Structure

```
app/(school)/admin/
  timetable/page.tsx        ← NEW
  content/page.tsx          ← NEW
  exams/page.tsx            ← NEW
  gradebook/page.tsx        ← NEW
  announcements/page.tsx    ← NEW
  settings/page.tsx         ← NEW

hooks/
  use-timetable.ts          ← NEW
  use-content.ts            ← NEW
  use-exams.ts              ← NEW
  use-gradebook.ts          ← NEW
  use-announcements.ts      ← NEW
  (use-school.ts already exists — extend for settings)
```

## Non-Goals (not in this spec)

- No online exam-taking UI (that's Student Dashboard — Plan B3)
- No AI-powered question generation UI (that's Teacher Dashboard — Plan B2)
- No rich text editor for announcements (plain textarea for v1)
- No drag-and-drop timetable slot assignment (click-to-assign dialog for v1)
- No real-time collaboration on marks entry
