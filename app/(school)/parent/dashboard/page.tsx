"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractArray } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import {
  useStudentAttendance,
  useStudentGradebook,
} from "@/hooks/use-student-insights";
import {
  CalendarDays,
  ArrowRight,
  Zap,
  ClipboardCheck,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  Users,
  BookOpen,
  CreditCard,
  Activity,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "just now";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
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
  greeting,
  todayLabel,
}: {
  name: string;
  isLoading: boolean;
  greeting: string;
  todayLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      {/* Mesh pattern overlay */}
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
              {greeting},{" "}
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

function ChildSelector({
  children,
  selectedChildId,
  onSelect,
}: {
  children: any[];
  selectedChildId: string;
  onSelect: (id: string | null) => void;
}) {
  if (children.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex items-center gap-3 mb-6"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 shadow-sm">
        <Users className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Viewing for
        </span>
        <Select value={selectedChildId} onValueChange={onSelect}>
          <SelectTrigger className="w-64 bg-white/80 backdrop-blur-sm border-border/60 shadow-sm">
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child: any) => {
              const id = String(child.student_id ?? child.id ?? "");
              const name = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Child";
              const cls = child.class_name ?? child.className ?? "";
              const sec = child.section_name ?? child.sectionName ?? "";
              return (
                <SelectItem key={id} value={id}>
                  {name} {cls && sec ? `(${cls} - ${sec})` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
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

interface ActivityEvent {
  id: string;
  label: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function RecentActivity({
  events,
  isLoading,
}: {
  events: ActivityEvent[];
  isLoading: boolean;
}) {
  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-brand-primary" />
        <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No recent activity
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Activity will appear here as your child engages with classes
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={fadeSlideUp}
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.iconBg} shadow-sm`}
              >
                <event.icon className={`h-4.5 w-4.5 ${event.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {event.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.time}
                </p>
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
    title: "View Attendance",
    description: "Check your child's attendance record",
    href: "/parent/attendance",
    icon: ClipboardCheck,
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
  },
  {
    title: "View Academics",
    description: "Grades, progress and report cards",
    href: "/parent/children",
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-500",
    hoverGradient: "group-hover:from-violet-600 group-hover:to-purple-600",
  },
  {
    title: "Pay Fees",
    description: "View and pay outstanding invoices",
    href: "#",
    icon: CreditCard,
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
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {quickActions.map((action) => (
          <motion.div
            key={action.title}
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

export default function ParentDashboardPage() {
  // --- Hydration-safe date values ---
  const [greeting, setGreeting] = useState("Welcome");
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setGreeting(getGreeting());
    setTodayLabel(getTodayLabel());
  }, []);

  // --- Data hooks ---
  const { data: parent, isLoading: parentLoading } = useParentProfile();
  const parentId = parent?.id;
  const { data: childrenRaw, isLoading: childrenLoading } = useParentChildren(parentId);
  const children = useMemo(() => extractArray(childrenRaw), [childrenRaw]);

  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(String(children[0].student_id ?? children[0].id ?? ""));
    }
  }, [children, selectedChildId]);

  const { data: attendanceRaw, isLoading: attendanceLoading } =
    useStudentAttendance(selectedChildId || undefined);
  const { data: gradebookRaw, isLoading: gradebookLoading } =
    useStudentGradebook(selectedChildId || undefined);

  // Fetch invoices for fee data
  const { data: invoicesRaw, isLoading: invoicesLoading } = useQuery({
    queryKey: ["parent-child-invoices", selectedChildId],
    queryFn: () => api.get<any>(`/api/v1/students/${selectedChildId}/invoices`),
    enabled: !!selectedChildId,
  });

  // --- Derived data ---
  const parentName = parent
    ? `${parent.first_name ?? ""}`.trim() || "Parent"
    : "Parent";

  // Attendance %
  const attendancePct = useMemo(() => {
    const att = attendanceRaw;
    if (!att) return "--";
    const total = att.total_days ?? att.totalDays ?? 0;
    const present = att.present_days ?? att.presentDays ?? att.present ?? 0;
    if (total === 0) return "--";
    return `${Math.round((present / total) * 100)}%`;
  }, [attendanceRaw]);

  // Overall grade
  const overallGrade = useMemo(() => {
    const grades = extractArray(gradebookRaw);
    if (grades.length === 0) return "--";
    const sum = grades.reduce((acc: number, g: any) => {
      const pct = Number(
        g.percentage ?? g.score_pct ?? g.scorePct ?? g.marks_obtained ?? g.marksObtained ?? 0
      );
      return acc + pct;
    }, 0);
    const avg = Math.round(sum / grades.length);
    if (avg >= 90) return "A+";
    if (avg >= 80) return "A";
    if (avg >= 70) return "B+";
    if (avg >= 60) return "B";
    if (avg >= 50) return "C";
    if (avg > 0) return "D";
    return "--";
  }, [gradebookRaw]);

  // Outstanding fees
  const outstandingFees = useMemo(() => {
    const invoices = extractArray(invoicesRaw);
    if (invoices.length === 0) return "--";
    const outstanding = invoices
      .filter((inv: any) => {
        const status = (inv.status ?? "").toLowerCase();
        return status === "pending" || status === "unpaid" || status === "overdue" || status === "partial";
      })
      .reduce((sum: number, inv: any) => {
        const amount = Number(inv.amount ?? inv.total ?? inv.balance_due ?? inv.amount_due ?? 0);
        const paid = Number(inv.paid ?? inv.amount_paid ?? 0);
        return sum + (amount - paid);
      }, 0);
    if (outstanding <= 0) return "Nil";
    if (outstanding >= 100000) return `₹${(outstanding / 100000).toFixed(1)}L`;
    if (outstanding >= 1000) return `₹${(outstanding / 1000).toFixed(1)}K`;
    return `₹${outstanding.toLocaleString("en-IN")}`;
  }, [invoicesRaw]);

  // Upcoming exams count (derive from gradebook or attendance context)
  const upcomingExamsLabel = "--";

  // Recent activity (derived from available data)
  const activityEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];

    // From attendance data
    const att = attendanceRaw;
    if (att) {
      const lastDate = att.last_marked_date ?? att.lastMarkedDate ?? att.updated_at ?? "";
      if (lastDate) {
        events.push({
          id: "att-latest",
          label: `Attendance marked: ${att.last_status ?? (att.present_days ? "Present" : "Recorded")}`,
          time: formatRelativeTime(lastDate),
          icon: ClipboardCheck,
          iconColor: "text-blue-600",
          iconBg: "bg-blue-100",
        });
      }
    }

    // From gradebook entries
    const grades = extractArray(gradebookRaw);
    grades.slice(0, 3).forEach((g: any, i: number) => {
      const name = g.exam_name ?? g.examName ?? g.title ?? g.name ?? "Assessment";
      const date = g.date ?? g.exam_date ?? g.created_at ?? g.updated_at ?? "";
      const score = g.percentage ?? g.score_pct ?? g.scorePct ?? g.marks_obtained ?? "";
      events.push({
        id: `grade-${i}`,
        label: `${name}${score ? ` - ${score}%` : ""}`,
        time: date ? formatRelativeTime(date) : "Recently",
        icon: GraduationCap,
        iconColor: "text-violet-600",
        iconBg: "bg-violet-100",
      });
    });

    // From invoices
    const invoices = extractArray(invoicesRaw);
    invoices.slice(0, 1).forEach((inv: any, i: number) => {
      const desc = inv.description ?? inv.title ?? inv.name ?? "Fee Invoice";
      const date = inv.created_at ?? inv.date ?? inv.due_date ?? "";
      events.push({
        id: `inv-${i}`,
        label: desc,
        time: date ? formatRelativeTime(date) : "Recently",
        icon: IndianRupee,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
      });
    });

    return events.slice(0, 5);
  }, [attendanceRaw, gradebookRaw, invoicesRaw]);

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
      label: "Overall Grade",
      value: overallGrade,
      icon: GraduationCap,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
      borderColor: "border-violet-100",
    },
    {
      label: "Outstanding Fees",
      value: outstandingFees,
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-100",
    },
    {
      label: "Upcoming Exams",
      value: upcomingExamsLabel,
      icon: CalendarCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-100",
    },
  ];

  const isLoading = parentLoading || childrenLoading || attendanceLoading || gradebookLoading || invoicesLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <WelcomeBanner
        name={parentName}
        isLoading={parentLoading}
        greeting={greeting}
        todayLabel={todayLabel}
      />

      {/* Child Selector */}
      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={(v) => v && setSelectedChildId(v)}
      />

      {/* KPI Cards */}
      <KpiCards items={kpis} isLoading={isLoading} />

      {/* Recent Activity */}
      <RecentActivity events={activityEvents} isLoading={isLoading} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
