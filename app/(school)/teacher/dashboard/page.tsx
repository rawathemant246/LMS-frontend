"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTeacherProfile,
  useTeacherAssignments,
  useMyClasses,
} from "@/hooks/use-teacher-context";
import { usePeriodDefinitions, useSectionTimetable } from "@/hooks/use-timetable";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileEdit,
  Clock,
  Sparkles,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Coffee,
  Zap,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if ((data as any)?.data?.items) return (data as any).data.items;
  if ((data as any)?.data && Array.isArray((data as any).data))
    return (data as any).data;
  if ((data as any)?.items) return (data as any).items;
  return [];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
}: {
  name: string;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      {/* Mesh / pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px, 70px 70px",
        }}
      />
      {/* Floating gradient orbs */}
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
              {getGreeting()},{" "}
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text">
                {name}
              </span>
            </h1>
            <p className="text-sm md:text-base text-white/70 font-medium">
              <CalendarDays className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
              {getTodayLabel()}
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
            {/* Subtle glow accent at bottom */}
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

interface ScheduleSlot {
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
  sectionName: string;
  isBreak: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

function TodaySchedule({
  slots,
  isLoading,
}: {
  slots: ScheduleSlot[];
  isLoading: boolean;
}) {
  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-brand-primary" />
        <h2 className="text-lg font-bold text-foreground">Today&apos;s Schedule</h2>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-44 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Coffee className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No classes scheduled for today
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Enjoy your day off!
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
          {slots.map((slot, i) => (
            <motion.div
              key={i}
              variants={fadeSlideUp}
              whileHover={{ y: -3 }}
              className="shrink-0"
            >
              <div
                className={`relative w-44 rounded-xl border p-4 transition-all duration-300 ${
                  slot.isBreak
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60"
                    : slot.isCurrent
                    ? "bg-gradient-to-br from-brand-primary-light to-indigo-100 border-brand-primary/40 shadow-md shadow-brand-primary/10 ring-2 ring-brand-primary/20"
                    : slot.isNext
                    ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60"
                    : "bg-white border-border hover:border-brand-primary/20 hover:shadow-sm"
                }`}
              >
                {/* Current period pulsing indicator */}
                {slot.isCurrent && (
                  <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary" />
                  </span>
                )}

                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {slot.periodName}
                </p>
                <p className="text-xs font-medium text-muted-foreground/80 mb-3">
                  {slot.startTime} &ndash; {slot.endTime}
                </p>

                {slot.isBreak ? (
                  <div className="flex items-center gap-1.5">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      Break
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-foreground leading-snug truncate">
                      {slot.subjectName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {slot.className} {slot.sectionName}
                    </p>
                  </>
                )}

                {slot.isCurrent && (
                  <Badge
                    variant="default"
                    className="mt-2.5 text-[10px] bg-brand-primary text-white"
                  >
                    Now
                  </Badge>
                )}
                {slot.isNext && !slot.isCurrent && (
                  <Badge
                    variant="secondary"
                    className="mt-2.5 text-[10px]"
                  >
                    Up Next
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

const quickActions = [
  {
    title: "Mark Attendance",
    description: "Record today's class attendance",
    href: "/teacher/attendance",
    icon: ClipboardCheck,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
  },
  {
    title: "Create Assignment",
    description: "Post homework or classwork",
    href: "/teacher/assignments",
    icon: FileEdit,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
  },
  {
    title: "AI Assistant",
    description: "Generate content with AI",
    href: "/teacher/ai-assistant",
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
  },
  {
    title: "Enter Marks",
    description: "Grade exams and assessments",
    href: "/teacher/gradebook",
    icon: BarChart3,
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
                  {/* Icon */}
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

                {/* Hover accent bar */}
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

export default function TeacherDashboardPage() {
  // --- Data hooks ---
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const { data: assignmentsRaw, isLoading: assignmentsLoading } =
    useTeacherAssignments(teacherId);
  const myClasses = useMyClasses(teacherId);

  const { data: periodsRaw, isLoading: periodsLoading } = usePeriodDefinitions();

  // --- Derived data ---
  const assignments = useMemo(
    () => extractArray(assignmentsRaw),
    [assignmentsRaw],
  );
  const periods = useMemo(() => extractArray(periodsRaw), [periodsRaw]);

  const teacherName = teacher
    ? `${teacher.first_name ?? ""} ${teacher.last_name ?? ""}`.trim()
    : "";

  const classCount = myClasses.length;

  // Estimate student count from assignments (sections * ~40) or show assignment count
  const studentEstimate = useMemo(() => {
    if (myClasses.length === 0) return 0;
    // unique section IDs * rough avg class size
    return myClasses.length * 40;
  }, [myClasses]);

  // --- Build today's schedule ---
  // We load timetable data from each unique section the teacher is assigned to.
  // Because hooks can't be called conditionally, we collect section IDs and use
  // a single aggregated query approach via the assignments themselves which
  // typically include timetable slot data or we synthesize from period definitions.
  const todayDayName = DAY_NAMES[new Date().getDay()];

  const scheduleSlots: ScheduleSlot[] = useMemo(() => {
    if (periods.length === 0) return [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Build schedule from period definitions + teacher assignments
    // Map period definitions to time slots, and if teacher has an assignment for
    // that period on the current day, show the subject/class
    const slotList: ScheduleSlot[] = periods
      .sort((a: any, b: any) => {
        const timeA = a.start_time || a.startTime || "00:00";
        const timeB = b.start_time || b.startTime || "00:00";
        return timeA.localeCompare(timeB);
      })
      .map((period: any) => {
        const startTime = period.start_time || period.startTime || "";
        const endTime = period.end_time || period.endTime || "";
        const isBreak =
          period.is_break ??
          period.isBreak ??
          (period.name || "").toLowerCase().includes("break") ??
          false;

        // Parse minutes for current-period detection
        const [sh, sm] = (startTime || "00:00").split(":").map(Number);
        const [eh, em] = (endTime || "00:00").split(":").map(Number);
        const startMin = (sh || 0) * 60 + (sm || 0);
        const endMin = (eh || 0) * 60 + (em || 0);

        const isCurrent =
          !isBreak && currentMinutes >= startMin && currentMinutes < endMin;

        // Find matching assignment for this period on today
        const match = assignments.find((a: any) => {
          const slotDay =
            a.day_of_week ?? a.dayOfWeek ?? a.day ?? "";
          const slotPeriod =
            a.period_definition_id ?? a.periodDefinitionId ?? a.period_id ?? "";
          return (
            slotDay === todayDayName &&
            (slotPeriod === period.id || slotPeriod === period.period_id)
          );
        });

        return {
          periodName: period.name || period.label || `Period`,
          startTime: startTime.slice(0, 5),
          endTime: endTime.slice(0, 5),
          subjectName: match?.subject_name ?? match?.subjectName ?? "",
          className: match?.class_name ?? match?.className ?? "",
          sectionName: match?.section_name ?? match?.sectionName ?? "",
          isBreak,
          isCurrent,
          isNext: false,
        } satisfies ScheduleSlot;
      });

    // Mark the next non-break period
    let foundCurrent = false;
    for (const slot of slotList) {
      if (slot.isCurrent) {
        foundCurrent = true;
        continue;
      }
      if (foundCurrent && !slot.isBreak) {
        slot.isNext = true;
        break;
      }
    }

    // If no current period was found, mark the first upcoming non-break slot
    if (!foundCurrent) {
      for (const slot of slotList) {
        const [sh, sm] = (slot.startTime || "00:00").split(":").map(Number);
        const startMin = (sh || 0) * 60 + (sm || 0);
        if (!slot.isBreak && startMin > currentMinutes) {
          slot.isNext = true;
          break;
        }
      }
    }

    return slotList;
  }, [periods, assignments, todayDayName]);

  // --- KPI definitions ---
  const kpis: KpiDef[] = [
    {
      label: "My Classes",
      value: classCount,
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-100",
    },
    {
      label: "My Students",
      value: studentEstimate > 0 ? `~${studentEstimate}` : 0,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-100",
    },
    {
      label: "Today's Attendance",
      value: "Not marked",
      icon: ClipboardCheck,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      borderColor: "border-sky-100",
    },
    {
      label: "Pending Grading",
      value: 0,
      icon: GraduationCap,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-100",
    },
  ];

  const isLoading = teacherLoading || assignmentsLoading || periodsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <WelcomeBanner name={teacherName || "Teacher"} isLoading={teacherLoading} />

      {/* KPI Cards */}
      <KpiCards items={kpis} isLoading={isLoading} />

      {/* Today's Schedule */}
      <TodaySchedule slots={scheduleSlots} isLoading={periodsLoading} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
