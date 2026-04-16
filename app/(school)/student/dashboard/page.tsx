"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useStudentAttendance } from "@/hooks/use-student-insights";
import { useSectionAssignments } from "@/hooks/use-assignments";
import { useExams } from "@/hooks/use-exams";
import {
  CalendarDays,
  ArrowRight,
  Zap,
  BookOpen,
  ClipboardCheck,
  Brain,
  FileEdit,
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getCountdown(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Overdue";
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diffDays > 0) return `${diffDays}d ${diffHrs}h left`;
  if (diffHrs > 0) return `${diffHrs}h left`;
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffMins}m left`;
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WelcomeBanner({
  name,
  isLoading,
  todayLabel,
}: {
  name: string;
  isLoading: boolean;
  todayLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px, 70px 70px",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64 bg-white/20 rounded-lg" />
            <Skeleton className="h-5 w-48 bg-white/20 rounded-lg" />
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Hey,{" "}
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text">
                {name}!
              </span>
            </h1>
            <p className="text-sm md:text-base text-white/70 font-medium">
              <CalendarDays className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
              {todayLabel}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

interface KpiDef {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

function KpiCards({
  items,
  isLoading,
}: {
  items: KpiDef[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {items.map((kpi) => (
        <motion.div key={kpi.label} variants={fadeSlideUp} whileHover={{ scale: 1.03, y: -2 }}>
          <Card
            className={`relative overflow-hidden border ${kpi.borderColor} bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {kpi.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.bgColor} shadow-sm`}
                >
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
            <div
              className={`pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 ${kpi.bgColor}`}
            />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

interface UpcomingItem {
  id: string;
  title: string;
  type: "assignment" | "exam";
  dueDate: string;
  subject?: string;
}

function UpcomingSection({
  items,
  isLoading,
}: {
  items: UpcomingItem[];
  isLoading: boolean;
}) {
  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-brand-primary" />
        <h2 className="text-lg font-bold text-foreground">Coming Up</h2>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-64 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              No upcoming assignments or exams
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
        >
          {items.map((item) => {
            const countdown = getCountdown(item.dueDate);
            const isOverdue = countdown === "Overdue";
            const isUrgent = countdown.includes("h left") && !countdown.includes("d");

            return (
              <motion.div
                key={item.id}
                variants={fadeSlideUp}
                whileHover={{ y: -3 }}
                className="shrink-0"
              >
                <div
                  className={`relative w-64 rounded-xl border p-4 transition-all duration-300 ${
                    isOverdue
                      ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60"
                      : isUrgent
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60"
                      : "bg-white border-border hover:border-brand-primary/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.type === "exam" ? (
                      <Badge variant="outline" className="border-transparent bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px]">
                        Exam
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                        Assignment
                      </Badge>
                    )}
                    {item.subject && (
                      <span className="text-[10px] text-muted-foreground/70 truncate">
                        {item.subject}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug truncate mb-1.5">
                    {item.title}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {isOverdue ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        isOverdue
                          ? "text-red-600"
                          : isUrgent
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {countdown}
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Due{" "}
                    {new Date(item.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

const quickActions = [
  {
    title: "Continue Learning",
    description: "Pick up where you left off",
    href: "/student/content",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
  },
  {
    title: "Submit Assignment",
    description: "View and submit your work",
    href: "/student/assignments",
    icon: FileEdit,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
  },
  {
    title: "AI Tutor",
    description: "Get help from your AI tutor",
    href: "/student/tutor",
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
  },
  {
    title: "My Progress",
    description: "Track your learning journey",
    href: "/student/progress",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-teal-600",
  },
];

function QuickActions() {
  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-brand-accent" />
        <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickActions.map((action) => (
          <motion.div
            key={action.href}
            variants={fadeSlideUp}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href={action.href} className="group block">
              <Card className="relative overflow-hidden border border-border/60 bg-white hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} shadow-sm transition-all duration-300`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground group-hover:text-brand-primary transition-colors duration-200">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center text-xs font-medium text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Go <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>

                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentDashboardPage() {
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setTodayLabel(getTodayLabel());
  }, []);

  // --- Data hooks ---
  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id;
  const sectionId = student?.section_id;

  const { data: attendanceRaw, isLoading: attendanceLoading } =
    useStudentAttendance(studentId);
  const { data: assignmentsRaw, isLoading: assignmentsLoading } =
    useSectionAssignments(sectionId);
  const { data: examsRaw, isLoading: examsLoading } = useExams();

  // --- Derived data ---
  const assignments = useMemo(() => extractArray(assignmentsRaw), [assignmentsRaw]);
  const exams = useMemo(() => extractArray(examsRaw), [examsRaw]);

  const studentName = student?.first_name ?? "Student";

  // Attendance percentage
  const attendancePct = useMemo(() => {
    const att = attendanceRaw;
    if (!att) return "--";
    const total = att.total_days ?? att.totalDays ?? 0;
    const present = att.present_days ?? att.presentDays ?? att.present ?? 0;
    if (total === 0) return "--";
    return `${Math.round((present / total) * 100)}%`;
  }, [attendanceRaw]);

  // Pending assignments count
  const pendingCount = useMemo(() => {
    return assignments.filter(
      (a: any) => {
        const status = (a.status ?? "").toLowerCase();
        return status === "pending" || status === "published" || status === "active";
      }
    ).length;
  }, [assignments]);

  // Upcoming exams count
  const upcomingExamCount = useMemo(() => {
    const now = new Date();
    return exams.filter((e: any) => {
      const examDate = new Date(e.date ?? e.exam_date ?? e.start_date ?? "");
      return examDate > now;
    }).length;
  }, [exams]);

  // Build upcoming items (next 3 assignments/exams by due date)
  const upcomingItems: UpcomingItem[] = useMemo(() => {
    const now = new Date();

    const assignmentItems: UpcomingItem[] = assignments
      .filter((a: any) => {
        const due = new Date(a.due_date ?? a.dueDate ?? "");
        return due > now;
      })
      .map((a: any) => ({
        id: a.assignment_id ?? a.id ?? String(Math.random()),
        title: a.title ?? a.name ?? "Assignment",
        type: "assignment" as const,
        dueDate: a.due_date ?? a.dueDate ?? "",
        subject: a.subject_name ?? a.subjectName ?? "",
      }));

    const examItems: UpcomingItem[] = exams
      .filter((e: any) => {
        const examDate = new Date(e.date ?? e.exam_date ?? e.start_date ?? "");
        return examDate > now;
      })
      .map((e: any) => ({
        id: e.exam_id ?? e.id ?? String(Math.random()),
        title: e.title ?? e.name ?? e.exam_name ?? "Exam",
        type: "exam" as const,
        dueDate: e.date ?? e.exam_date ?? e.start_date ?? "",
        subject: e.subject_name ?? e.subjectName ?? "",
      }));

    return [...assignmentItems, ...examItems]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [assignments, exams]);

  // --- KPI definitions ---
  const kpis: KpiDef[] = [
    {
      label: "Attendance",
      value: attendancePct,
      icon: ClipboardCheck,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      borderColor: "border-sky-100",
    },
    {
      label: "Overall Mastery",
      value: "--",
      icon: Brain,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
      borderColor: "border-violet-100",
    },
    {
      label: "Pending Tasks",
      value: pendingCount,
      icon: FileEdit,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-100",
    },
    {
      label: "Upcoming Exams",
      value: upcomingExamCount,
      icon: CalendarDays,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-100",
    },
  ];

  const isLoading = studentLoading || attendanceLoading || assignmentsLoading || examsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <WelcomeBanner
        name={studentName}
        isLoading={studentLoading}
        todayLabel={todayLabel}
      />

      <KpiCards items={kpis} isLoading={isLoading} />

      <UpcomingSection items={upcomingItems} isLoading={assignmentsLoading || examsLoading} />

      <QuickActions />
    </div>
  );
}
