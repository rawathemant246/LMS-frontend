# B4: Parent Dashboard — Design Spec

## Goal

Build 7 Parent Dashboard pages — parent's view of their children's school life with attendance, academics, fees, and communication.

## Context

- **Existing**: 15 Admin + 12 Teacher + 11 Student pages built
- **Backend APIs**: `GET /parents/{id}/children` returns linked students. All child data accessible via student endpoints.
- **Design**: Premium SaaS quality matching other dashboards. Light theme.
- **Parent nav**: Already defined in `lib/school-nav.ts` (needs 1 addition: Notifications)

## Architecture: Parent Context

Parents may have multiple children. The flow:
1. JWT `sub` → user_id → find parent profile from `GET /api/v1/parents` (match by auth_user_id)
2. Parent's `id` → `GET /api/v1/parents/{id}/children` → returns linked student profiles
3. Child selector (dropdown) lets parent switch between children
4. All subsequent pages show data for the selected child

Create `hooks/use-parent-context.ts`:
```
useParentProfile() — finds parent profile for current user
useParentChildren(parentId) — returns linked children
```

Selected child stored in component state (not Zustand — transient).

## Nav Update

Add Notifications to `PARENT_NAV`:
```typescript
export const PARENT_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/parent/dashboard", icon: "LayoutDashboard" },
    { name: "My Children", href: "/parent/children", icon: "Users" },
  ]},
  { section: "CHILD", items: [
    { name: "Attendance", href: "/parent/attendance", icon: "ClipboardCheck" },
    { name: "Academics", href: "/parent/academics", icon: "GraduationCap" },
    { name: "Fees", href: "/parent/fees", icon: "IndianRupee" },
  ]},
  { section: "COMMUNICATION", items: [
    { name: "Announcements", href: "/parent/communication", icon: "MessageSquare" },
    { name: "Notifications", href: "/parent/notifications", icon: "Bell" },
  ]},
];
```

---

## Page 1: Parent Dashboard (`/parent/dashboard`)

- Welcome banner with parent name
- Child selector dropdown (if multiple children)
- KPI cards for selected child: Attendance %, Overall Grade, Pending Fees, Upcoming Exams
- Recent activity: last 5 events (attendance, grades, fees)
- Quick links: View Attendance, View Academics, Pay Fees

## Page 2: My Children (`/parent/children`)

- Card grid of linked children from `useParentChildren(parentId)`
- Each card: child name, class-section, roll number, photo/avatar, attendance %, mastery %
- Click card → sets as selected child, navigates to academics
- If single child: auto-select and show detail view directly

## Page 3: Attendance (`/parent/attendance`)

- Child selector at top
- Attendance summary: present/absent/late counts, percentage, monthly trend chart
- Calendar view or monthly grid showing daily attendance status (color-coded dots)
- Data from `GET /api/v1/students/{childId}/attendance`

## Page 4: Academics (`/parent/academics`)

- Child selector at top
- Three tabs: **Gradebook**, **Report Cards**, **Exam Results**

**Gradebook tab**: Subject-wise marks summary from `GET /students/{id}/gradebook`. Table: subject, exam, marks, grade.

**Report Cards tab**: List from `GET /students/{id}/report-cards`. View/download PDF (same pattern as student report cards page).

**Exam Results tab**: List of exams with scores from exam results endpoints. Score, grade, rank if available.

## Page 5: Fees (`/parent/fees`)

- Child selector at top
- Fee summary: total due, total paid, outstanding balance
- Invoice list from `GET /students/{childId}/invoices`
- Each invoice: number, date, amount, status badge (pending=amber, partial=blue, paid=green, overdue=red)
- "Pay Now" button → for v1, show Razorpay payment link or a placeholder "Contact school for payment"
- Payment history section showing past payments

## Page 6: Communication (`/parent/communication`)

- Two tabs: **Announcements**, **Messages** (placeholder)

**Announcements tab**: Same as student announcements — read-only, can acknowledge. Shows school/class/section announcements for child's class.

**Messages tab**: Placeholder for v1 — "Teacher messaging coming soon" with illustration. Future: direct messaging with child's teachers.

## Page 7: Notifications (`/parent/notifications`)

- Same as student/teacher notifications page
- Reuses `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` from `hooks/use-notifications.ts`

---

## File Structure

```
app/(school)/parent/
  dashboard/page.tsx        ← NEW
  children/page.tsx         ← NEW
  attendance/page.tsx       ← NEW
  academics/page.tsx        ← NEW
  fees/page.tsx             ← NEW
  communication/page.tsx    ← NEW
  notifications/page.tsx    ← NEW

hooks/
  use-parent-context.ts     ← NEW
  (reuses: use-student-insights.ts, use-gradebook.ts, use-fee.ts, use-announcements.ts, use-notifications.ts)

lib/
  school-nav.ts             ← MODIFY (update PARENT_NAV)
```

## Non-Goals
- No online payment integration (Razorpay placeholder only)
- No teacher messaging (placeholder in Communication)
- No push notifications
