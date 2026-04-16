# B1c: School Admin Remaining Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 remaining School Admin pages (Timetable, Content, Exams, Gradebook, Announcements, Settings) to complete the admin dashboard.

**Architecture:** All pages live under `app/(school)/admin/` using the existing SchoolLayout. Each page gets a dedicated TanStack Query hook file in `hooks/`. Pages follow the established pattern: "use client", PageHeader, Tabs, shadcn/ui components, Framer Motion animations. All backend API routes already exist — this is pure frontend work.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Framer Motion, Lucide icons, Recharts (for charts), sonner (toasts)

**Spec:** `docs/superpowers/specs/2026-04-16-b1c-school-admin-remaining-pages.md`

**Branch:** `feature/b1c-timetable-content-exams-settings` (already created from develop)

**Codebase patterns to follow:**
- Hooks: `"use client"`, `useQuery`/`useMutation` from `@tanstack/react-query`, `api` from `@/lib/api`, `toast` from `sonner`
- Data extraction: `const items: any[] = Array.isArray(data) ? data : (data as any)?.data?.items ?? (data as any)?.data ?? [];`
- Pages: `"use client"`, `PageHeader`, `Tabs`, inline component functions for each tab, `useState` for local state
- All API responses may be wrapped in `{ data: ... }` — always unwrap

---

### Task 1: Timetable hooks + page

**Files:**
- Create: `hooks/use-timetable.ts`
- Create: `app/(school)/admin/timetable/page.tsx`

- [ ] **Step 1: Create timetable hooks**

Create `hooks/use-timetable.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function usePeriodDefinitions() {
  return useQuery({
    queryKey: ["period-definitions"],
    queryFn: () => api.get<any>("/api/v1/period-definitions"),
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/period-definitions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["period-definitions"] });
      toast.success("Period created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSectionTimetable(sectionId?: string) {
  return useQuery({
    queryKey: ["timetable", sectionId],
    queryFn: () => api.get<any>(`/api/v1/sections/${sectionId}/timetable`),
    enabled: !!sectionId,
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/timetable-slots", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Slot assigned");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create timetable page**

Create `app/(school)/admin/timetable/page.tsx`. This is a split-view layout:
- Left panel: period definitions list with add/edit dialog
- Right panel: class/section selectors → weekly grid (Mon-Sat rows x period columns)
- Click grid cell → assign subject+teacher dialog
- Framer Motion: staggered row entry, cell hover scale, tab crossfade

Key state:
```typescript
const [selectedClassId, setSelectedClassId] = useState("");
const [selectedSectionId, setSelectedSectionId] = useState("");
const [showAddPeriod, setShowAddPeriod] = useState(false);
const [showAssignSlot, setShowAssignSlot] = useState(false);
const [selectedCell, setSelectedCell] = useState<{day: string; periodId: string} | null>(null);
```

Key data hooks:
```typescript
const { data: periodsRaw, isLoading: periodsLoading } = usePeriodDefinitions();
const { data: yearsData } = useAcademicYears();
const { data: classesData } = useClasses(selectedYearId);
const { data: sectionsData } = useSections(selectedClassId);
const { data: timetableData } = useSectionTimetable(selectedSectionId);
const { data: subjectsData } = useSubjects();
const { data: teachersRaw } = useSchoolTeachers();
```

Days array: `const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];`

Subject color palette:
```typescript
const SUBJECT_COLORS = [
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
];
```

Implement the full page with:
1. PageHeader with "Timetable" title
2. Two-column flex layout (left 280px, right flex-1)
3. Left: period list with type badges (class=blue, break=yellow, lunch=orange), add button, edit/delete
4. Right: year/class/section dropdowns, then a grid table with days as columns and periods as rows
5. Grid cells: empty = dashed border click-to-assign, filled = subject name + teacher, color-coded
6. Break rows: spanning full width with yellow background
7. Dialog for adding period: label, start_time (time input), end_time, period_type select
8. Dialog for assigning slot: subject select, teacher select
9. Framer Motion `motion.div` wrappers with stagger animations

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add hooks/use-timetable.ts app/\(school\)/admin/timetable/
git commit -m "feat(b1c): add Timetable page with period definitions and weekly grid

- Split view: period list left, weekly grid right
- Click-to-assign subject+teacher per cell
- Color-coded by subject, break rows highlighted
- Framer Motion staggered animations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Content Management hooks + page

**Files:**
- Create: `hooks/use-content.ts`
- Create: `app/(school)/admin/content/page.tsx`

- [ ] **Step 1: Create content hooks**

Create `hooks/use-content.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useChapters(subjectId?: string) {
  return useQuery({
    queryKey: ["chapters", subjectId],
    queryFn: () => api.get<any>(`/api/v1/subjects/${subjectId}/chapters`),
    enabled: !!subjectId,
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/chapters", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTopics(chapterId?: string) {
  return useQuery({
    queryKey: ["topics", chapterId],
    queryFn: () => api.get<any>(`/api/v1/chapters/${chapterId}/topics`),
    enabled: !!chapterId,
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/topics", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      toast.success("Topic created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLearningObjects(topicId?: string) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic_id", topicId);
  return useQuery({
    queryKey: ["learning-objects", topicId],
    queryFn: () => api.get<any>(`/api/v1/learning-objects?${params.toString()}`),
    enabled: !!topicId,
  });
}

export function useCreateLearningObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/learning-objects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-objects"] });
      toast.success("Learning object created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContentOrder(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => api.put(`/api/v1/topics/${topicId}/content-order`, { order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-objects"] });
      toast.success("Order updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUploadDirect() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/uploads/direct`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create content management page**

Create `app/(school)/admin/content/page.tsx`. Tree sidebar + detail panel layout:
- Left panel (280px): collapsible tree — Subject → Chapter → Topic
- Right panel: breadcrumb trail, topic detail, learning objects list with upload

Key state:
```typescript
const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
const [selectedTopic, setSelectedTopic] = useState<{ subjectId: string; subjectName: string; chapterId: string; chapterName: string; topicId: string; topicName: string } | null>(null);
const [showAddChapter, setShowAddChapter] = useState(false);
const [showAddTopic, setShowAddTopic] = useState(false);
const [showUpload, setShowUpload] = useState(false);
const [addToSubjectId, setAddToSubjectId] = useState("");
const [addToChapterId, setAddToChapterId] = useState("");
```

Tree component renders subjects from `useSubjects()`, then lazily loads chapters via `useChapters(subjectId)` when expanded, then topics via `useTopics(chapterId)`. Use Framer Motion `AnimatePresence` + `motion.div` with height animation for expand/collapse.

Right panel shows learning objects from `useLearningObjects(selectedTopic?.topicId)`. Each item has type icon (FileText for PDF, Video for video, Image for image), title, metadata, status badge. Upload dialog uses `react-dropzone` for file drag-and-drop, calls `useUploadDirect()` then `useCreateLearningObject()`.

Type icon mapping:
```typescript
const TYPE_ICONS: Record<string, any> = {
  pdf: FileText,
  video: Video,
  image: ImageIcon,
  link: Link2,
  document: FileText,
};
```

Implement with Framer Motion stagger on learning objects list, tree expand/collapse animations.

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-content.ts app/\(school\)/admin/content/
git commit -m "feat(b1c): add Content Management page with tree nav and learning objects

- Collapsible tree sidebar: Subject → Chapter → Topic
- Right panel: breadcrumb, learning objects list, upload
- Lazy-load chapters/topics on expand
- Framer Motion tree expand/collapse animations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Exams hooks + page

**Files:**
- Create: `hooks/use-exams.ts`
- Create: `app/(school)/admin/exams/page.tsx`

- [ ] **Step 1: Create exams hooks**

Create `hooks/use-exams.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<any>("/api/v1/exams"),
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/exams", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExam(id?: string) {
  return useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.get<any>(`/api/v1/exams/${id}`),
    enabled: !!id,
  });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/exams/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam published");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAutoGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: any }) =>
      api.post(`/api/v1/exams/${examId}/auto-generate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam paper generated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExamResults(examId?: string) {
  return useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => api.get<any>(`/api/v1/exams/${examId}/results`),
    enabled: !!examId,
  });
}

export function useBulkMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: any }) =>
      api.post(`/api/v1/exams/${examId}/bulk-marks`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-results"] });
      toast.success("Marks saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeclareResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => api.post(`/api/v1/exams/${examId}/declare-results`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Results declared");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useQuestions(filters?: { subject_id?: string; chapter_id?: string; question_type?: string; difficulty?: string }) {
  const params = new URLSearchParams();
  if (filters?.subject_id) params.set("subject_id", filters.subject_id);
  if (filters?.chapter_id) params.set("chapter_id", filters.chapter_id);
  if (filters?.question_type) params.set("question_type", filters.question_type);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  return useQuery({
    queryKey: ["questions", filters],
    queryFn: () => api.get<any>(`/api/v1/questions?${params.toString()}`),
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/questions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVerifyQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/questions/${id}/verify`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question verified");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create exams page**

Create `app/(school)/admin/exams/page.tsx`. Three-tab layout: Exams, Question Bank, Results.

**Tab 1 (Exams):**
- Filter bar: class, subject, status selectors
- 2-column card grid of exams
- Each card: name, class/subject line, marks/duration, date, status badge, action buttons
- Draft cards: Edit, Auto-Generate, Publish buttons
- Published cards: View Paper, Results, Marks Entry buttons
- "+ Create Exam" dialog: name, exam_type (select: unit_test/mid_term/final/practice), subject_id, total_marks, duration_minutes, scheduled_date

Status badge colors:
```typescript
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-700",
  results_declared: "bg-purple-100 text-purple-700",
};
```

**Tab 2 (Question Bank):**
- Filter bar: subject, chapter (loaded from selected subject chapters), question_type, difficulty
- Table with columns: Question (truncated 100 chars), Type (badge), Difficulty (badge), Marks, Chapter, Verified (checkmark icon)
- "+ Add Question" dialog: question_text textarea, question_type select (mcq/short_answer/long_answer/true_false/fill_blank/match_following/assertion_reason), options array (dynamic — show for MCQ/match types), correct_answer, marks, difficulty (easy/medium/hard), chapter_id, explanation textarea
- Verify button per row

Difficulty badge colors:
```typescript
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};
```

Question type labels:
```typescript
const QTYPE_LABELS: Record<string, string> = {
  mcq: "MCQ",
  short_answer: "Short",
  long_answer: "Long",
  true_false: "T/F",
  fill_blank: "Fill",
  match_following: "Match",
  assertion_reason: "A&R",
};
```

**Tab 3 (Results):**
- Exam selector dropdown
- When selected: marks entry grid (spreadsheet-style, same as gradebook)
- Declare Results button
- Summary stats row: average, highest, lowest, pass% (use Recharts BarChart for grade distribution)

Implement with Framer Motion: staggered card entry on Exams tab, table row stagger on Question Bank, tab crossfade via AnimatePresence.

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-exams.ts app/\(school\)/admin/exams/
git commit -m "feat(b1c): add Exams page with exam cards, question bank, and results

- Tab 1: exam card grid with create dialog, filters, publish/auto-generate
- Tab 2: question bank table with CRUD, filters, verify
- Tab 3: results with marks grid and grade distribution chart
- Framer Motion staggered cards and tab crossfade

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Gradebook hooks + page

**Files:**
- Create: `hooks/use-gradebook.ts`
- Create: `app/(school)/admin/gradebook/page.tsx`

- [ ] **Step 1: Create gradebook hooks**

Create `hooks/use-gradebook.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useGradeScales() {
  return useQuery({
    queryKey: ["grade-scales"],
    queryFn: () => api.get<any>("/api/v1/grade-scales"),
  });
}

export function useGradeScale(id?: string) {
  return useQuery({
    queryKey: ["grade-scales", id],
    queryFn: () => api.get<any>(`/api/v1/grade-scales/${id}`),
    enabled: !!id,
  });
}

export function useCreateGradeScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/grade-scales", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grade-scales"] });
      toast.success("Grade scale created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/report-cards/generate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-cards"] });
      toast.success("Report cards generated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePublishReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/report-cards/publish", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-cards"] });
      toast.success("Report cards published");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStudentReportCards(studentId?: string) {
  return useQuery({
    queryKey: ["report-cards", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/report-cards`),
    enabled: !!studentId,
  });
}

export function useReportCardPdf(reportCardId?: string) {
  return useQuery({
    queryKey: ["report-card-pdf", reportCardId],
    queryFn: async () => {
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/report-cards/${reportCardId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch PDF");
      return URL.createObjectURL(await res.blob());
    },
    enabled: !!reportCardId,
  });
}
```

- [ ] **Step 2: Create gradebook page**

Create `app/(school)/admin/gradebook/page.tsx`. Three-tab layout: Marks Entry, Grade Scales, Report Cards.

**Tab 1 (Marks Entry):**
- Filter bar: exam (from `useExams()`), class/section, subject
- Spreadsheet grid:
  - Header row: #, Roll No, Student Name, then one column per exam paper section (label + "/maxmarks"), Total, Grade
  - Data rows: student name + roll, inline `<input type="number">` per section, auto-calculated total + grade
  - Total = sum of section marks; Grade looked up from grade scale
  - Validation: value > max shows red border, below 40% total shows red background row
  - Class average footer row
- "Save All" button calls `useBulkMarks()`
- Tab/Enter moves between input cells (implement with `onKeyDown` handler)

Key state:
```typescript
const [selectedExamId, setSelectedExamId] = useState("");
const [selectedSectionId, setSelectedSectionId] = useState("");
const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
// marks[studentId][sectionId] = number
```

Grade lookup function:
```typescript
function getGrade(total: number, maxTotal: number, gradeEntries: any[]): string {
  const pct = (total / maxTotal) * 100;
  const entry = gradeEntries.find((e: any) => pct >= e.min_percentage && pct <= e.max_percentage);
  return entry?.grade_label ?? "—";
}
```

**Tab 2 (Grade Scales):**
- List of grade scales as expandable cards
- Each shows: name, type badge, entry count
- Expand to see entries table: grade_label, min%, max%, grade_point, description
- "+ Create Grade Scale" dialog with dynamic entries list (add/remove entry rows)

**Tab 3 (Report Cards):**
- Class/section selector
- Student list with report card status: badge (generated/published/not_generated)
- "Generate All" button → `useGenerateReportCards()`
- "Publish All" button → `usePublishReportCards()`
- Per-student: "Download PDF" button, "View" button (opens dialog with embedded PDF via object tag)

Implement with Framer Motion: row stagger on grid, cell flash animation on save, grade badge transitions.

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-gradebook.ts app/\(school\)/admin/gradebook/
git commit -m "feat(b1c): add Gradebook page with marks grid, grade scales, report cards

- Tab 1: spreadsheet-style marks entry with auto-total and auto-grade
- Tab 2: grade scales CRUD with expandable entries
- Tab 3: report card generation, publishing, PDF download
- Red highlight for low scorers, Tab/Enter cell navigation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Announcements hooks + page

**Files:**
- Create: `hooks/use-announcements.ts`
- Create: `app/(school)/admin/announcements/page.tsx`

- [ ] **Step 1: Create announcements hooks**

Create `hooks/use-announcements.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<any>("/api/v1/announcements"),
  });
}

export function useAnnouncement(id?: string) {
  return useQuery({
    queryKey: ["announcements", id],
    queryFn: () => api.get<any>(`/api/v1/announcements/${id}`),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/announcements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

- [ ] **Step 2: Create announcements page**

Create `app/(school)/admin/announcements/page.tsx`. Simple list + create dialog.

- PageHeader: "Announcements" + "+ New Announcement" button
- Filter bar: scope (all/school/class/section), status (all/published/draft), search input
- Vertical card list (not table — body text is long):
  - Each card: title (bold), body preview (2 lines, `line-clamp-2`), scope badge, published/draft badge, created date (`formatRelativeTime`), ack count if `requires_ack`
  - Click card → view full announcement in dialog
- Create dialog fields:
  - title: Input
  - body: Textarea (6 rows)
  - scope: radio group (school/class/section)
  - target_class_id: Select (shown when scope=class or section), uses `useClasses()`
  - target_section_id: Select (shown when scope=section), uses `useSections(selectedClassId)`
  - is_published: Switch toggle
  - requires_ack: Checkbox

Scope badge colors:
```typescript
const SCOPE_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-700",
  class: "bg-purple-100 text-purple-700",
  section: "bg-green-100 text-green-700",
};
```

Implement with Framer Motion: staggered card entry, slide-in animation for new announcements at top of list.

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-announcements.ts app/\(school\)/admin/announcements/
git commit -m "feat(b1c): add Announcements page with card list and create dialog

- Vertical card list with scope/status badges
- Create dialog with conditional class/section selectors
- Search and filter by scope and status
- Framer Motion staggered card entry

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Settings page

**Files:**
- Modify: `hooks/use-school.ts` (add mutation)
- Create: `app/(school)/admin/settings/page.tsx`

- [ ] **Step 1: Add school profile mutation to use-school.ts**

Add to `hooks/use-school.ts`:

```typescript
export function useUpdateSchoolProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/school/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school", "profile"] });
      toast.success("School profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

Add `useMutation, useQueryClient` to the imports and `toast` from `sonner`.

- [ ] **Step 2: Create settings page**

Create `app/(school)/admin/settings/page.tsx`. Three-tab layout: School Profile, Branding, Academic Config.

**Tab 1 (School Profile):**
- Form with fields: school_name, board (select: CBSE/ICSE/State Board), affiliation_number, address (textarea), phone, email, website
- Logo upload: current logo preview (or placeholder), click to change, uses file input + `useUploadDirect()` from use-content hooks (or inline fetch)
- Pre-filled from `useSchoolProfile()`
- "Save Changes" button calls `useUpdateSchoolProfile()`

**Tab 2 (Branding):**
- Three color pickers: primary_color, accent_color, sidebar_color
- Each: label, hex `<input type="color">` + text input showing hex value
- Live preview panel: mini sidebar rectangle + header bar + button, rendered with the chosen colors using inline styles
- "Reset to Defaults" button: primary=#4F46E5, accent=#F97316, sidebar=#1E1B4B
- Logo URL input or upload
- "Save Branding" button → updates school profile `branding` JSONB field
- On save, also update the school Zustand store and CSS custom properties so the change is immediately visible in the real sidebar

Update Zustand on save:
```typescript
import { useSchoolStore } from "@/lib/school-store";
// After successful save:
useSchoolStore.getState().setSchool({ ...currentSchool, branding: newBranding });
```

**Tab 3 (Academic Config):**
- Current academic year display (read-only, from `useCurrentAcademicYear()`) with link to Academic Setup page
- Grading system: link to Gradebook → Grade Scales tab
- Minimum attendance %: number input (default 75)
- Exam weightage: internal assessment % + external exam % (two number inputs, must sum to 100)
- "Save Config" button → saves to school profile JSONB

Implement with Framer Motion: color picker live transitions, form save pulse animation, tab crossfade.

- [ ] **Step 3: Verify build**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add hooks/use-school.ts app/\(school\)/admin/settings/
git commit -m "feat(b1c): add Settings page with school profile, branding editor, academic config

- Tab 1: school profile form with logo upload
- Tab 2: color pickers with live preview, updates sidebar in real-time
- Tab 3: attendance rules, exam weightage
- Framer Motion transitions on color changes

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Final verification and cleanup

**Files:**
- Modify: `.gitignore` (add .superpowers/)

- [ ] **Step 1: Add .superpowers to gitignore**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 2: Full build verification**

Run: `cd /Users/hemantrawat/Documents/LMS/lms-frontend && npm run build`
Expected: Build succeeds with all 6 new pages compiled

- [ ] **Step 3: Verify all pages exist in nav**

Check that `lib/school-nav.ts` already has nav items for all 6 pages:
- Timetable → `/admin/timetable`
- Content → `/admin/content`
- Exams → `/admin/exams`
- Gradebook → `/admin/gradebook`
- Announcements → `/admin/announcements`
- Settings → `/admin/settings`

These are already defined — no changes needed.

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to gitignore

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Push branch**

```bash
git push -u origin feature/b1c-timetable-content-exams-settings
```
