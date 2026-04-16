export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permission?: string;
}

export interface NavSection {
  section: string | null;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    { name: "Academic Setup", href: "/admin/academic", icon: "GraduationCap" },
  ]},
  { section: "PEOPLE", items: [
    { name: "Students", href: "/admin/students", icon: "Users", permission: "student.read" },
    { name: "Teachers", href: "/admin/teachers", icon: "UserCheck", permission: "teacher.read" },
    { name: "Parents", href: "/admin/parents", icon: "Heart", permission: "parent.read" },
  ]},
  { section: "ACADEMICS", items: [
    { name: "Attendance", href: "/admin/attendance", icon: "ClipboardCheck", permission: "attendance.read" },
    { name: "Timetable", href: "/admin/timetable", icon: "Calendar" },
    { name: "Content", href: "/admin/content", icon: "BookOpen", permission: "content.read" },
    { name: "Exams", href: "/admin/exams", icon: "FileText", permission: "exam.read" },
    { name: "Gradebook", href: "/admin/gradebook", icon: "BarChart3", permission: "gradebook.read" },
  ]},
  { section: "OPERATIONS", items: [
    { name: "Fees", href: "/admin/fees", icon: "IndianRupee", permission: "fee.read" },
    { name: "Announcements", href: "/admin/announcements", icon: "Megaphone", permission: "announcement.read" },
    { name: "Reports", href: "/admin/reports", icon: "PieChart" },
    { name: "Settings", href: "/admin/settings", icon: "Settings" },
  ]},
];

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
  { section: "AI", items: [
    { name: "AI Assistant", href: "/teacher/ai-assistant", icon: "Brain" },
    { name: "Announcements", href: "/teacher/announcements", icon: "Megaphone" },
  ]},
];

export const STUDENT_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/student/dashboard", icon: "LayoutDashboard" },
    { name: "My Classes", href: "/student/classes", icon: "BookOpen" },
  ]},
  { section: "LEARNING", items: [
    { name: "Content", href: "/student/content", icon: "PlayCircle" },
    { name: "Assignments", href: "/student/assignments", icon: "PenTool" },
    { name: "Exams", href: "/student/exams", icon: "FileText" },
  ]},
  { section: "AI", items: [
    { name: "AI Tutor", href: "/student/tutor", icon: "Brain" },
    { name: "My Progress", href: "/student/progress", icon: "TrendingUp" },
  ]},
];

export const PARENT_NAV: NavSection[] = [
  { section: null, items: [
    { name: "Dashboard", href: "/parent/dashboard", icon: "LayoutDashboard" },
    { name: "My Children", href: "/parent/children", icon: "Users" },
  ]},
  { section: "CHILD", items: [
    { name: "Attendance", href: "/parent/attendance", icon: "ClipboardCheck" },
    { name: "Academics", href: "/parent/academics", icon: "GraduationCap" },
    { name: "Fees", href: "/parent/fees", icon: "IndianRupee" },
    { name: "Communication", href: "/parent/communication", icon: "MessageSquare" },
  ]},
];

export function getNavForRole(role: string): NavSection[] {
  switch (role) {
    case "admin": return ADMIN_NAV;
    case "teacher": return TEACHER_NAV;
    case "student": return STUDENT_NAV;
    case "parent": return PARENT_NAV;
    default: return ADMIN_NAV;
  }
}
