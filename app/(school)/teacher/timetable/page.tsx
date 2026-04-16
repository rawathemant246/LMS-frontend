"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Coffee,
  Utensils,
  BookOpen,
  Sparkles,
} from "lucide-react";
import {
  useTeacherProfile,
  useTeacherAssignments,
} from "@/hooks/use-teacher-context";
import { usePeriodDefinitions } from "@/hooks/use-timetable";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUBJECT_COLORS = [
  {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-500 to-violet-500",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-cyan-500",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    gradient: "from-emerald-500 to-teal-500",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-500 to-orange-500",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    gradient: "from-pink-500 to-rose-500",
    dot: "bg-pink-500",
  },
  {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    gradient: "from-cyan-500 to-sky-500",
    dot: "bg-cyan-500",
  },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const JS_DAY_MAP: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

function formatTime(time: string): string {
  if (!time) return "";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${suffix}`;
  } catch {
    return time;
  }
}

function getTodayDayKey(): string {
  return JS_DAY_MAP[new Date().getDay()] ?? "";
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getSubjectColor(subjectId: string, subjectIds: string[]) {
  const idx = subjectIds.indexOf(subjectId);
  return SUBJECT_COLORS[idx >= 0 ? idx % SUBJECT_COLORS.length : 0];
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cellPop: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageBanner({
  periodsCount,
  isLoading,
}: {
  periodsCount: number;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      {/* Mesh overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 45%, white 1px, transparent 1px), radial-gradient(circle at 75% 25%, white 1px, transparent 1px), radial-gradient(circle at 50% 75%, white 1px, transparent 1px)",
          backgroundSize: "55px 55px, 75px 75px, 65px 65px",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                My Timetable
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Your weekly schedule across all assigned sections
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Clock className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function SubjectLegend({
  subjectMap,
  subjectIds,
}: {
  subjectMap: Record<string, string>;
  subjectIds: string[];
}) {
  if (subjectIds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap items-center gap-2.5 mb-6"
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
        Subjects:
      </span>
      {subjectIds.map((sid) => {
        const color = getSubjectColor(sid, subjectIds);
        const name = subjectMap[sid] ?? "Subject";
        return (
          <div
            key={sid}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border ${color.border} ${color.bg}`}
          >
            <span className={`h-2 w-2 rounded-full ${color.dot}`} />
            <span className={`text-xs font-semibold ${color.text}`}>
              {name}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function TimetableGrid({
  periods,
  assignments,
  subjectIds,
  isLoading,
}: {
  periods: any[];
  assignments: any[];
  subjectIds: string[];
  isLoading: boolean;
}) {
  const todayKey = getTodayDayKey();
  const currentMinutes = getCurrentMinutes();

  // Build slot lookup: `${periodId}-${day}` -> assignment
  const slotMap = useMemo(() => {
    const map: Record<string, any> = {};
    assignments.forEach((a: any) => {
      const day = a.day_of_week ?? a.dayOfWeek ?? a.day ?? "";
      const periodId =
        a.period_definition_id ?? a.periodDefinitionId ?? a.period_id ?? "";
      if (day && periodId) {
        const key = `${periodId}-${day}`;
        map[key] = a;
      }
    });
    return map;
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-border/40">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">
                  Period
                </th>
                {DAY_LABELS.map((label) => (
                  <th
                    key={label}
                    className="px-2 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {DAY_LABELS.map((_, j) => (
                    <td key={j} className="px-2 py-3">
                      <Skeleton className="h-16 w-full rounded-xl" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
            <Calendar className="h-8 w-8 text-brand-primary/60" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">
            No periods defined
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Period definitions have not been set up yet. Please contact your
            school administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-border/40">
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">
                Period
              </th>
              {DAYS.map((day, di) => {
                const isToday = day === todayKey;
                return (
                  <th
                    key={day}
                    className={`px-2 py-3.5 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
                      isToday
                        ? "text-brand-primary bg-brand-primary/5"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{DAY_LABELS[di]}</span>
                      {isToday && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-brand-primary" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {periods.map((period: any) => {
              const pId = String(
                period.period_definition_id ?? period.id ?? ""
              );
              const pType = period.period_type ?? "class";
              const isBreak = pType === "break" || pType === "lunch";

              const startMin = parseMinutes(
                period.start_time ?? period.startTime ?? ""
              );
              const endMin = parseMinutes(
                period.end_time ?? period.endTime ?? ""
              );
              const isCurrent =
                todayKey !== "" &&
                currentMinutes >= startMin &&
                currentMinutes < endMin;

              // Break/Lunch row -- full-width amber bar
              if (isBreak) {
                return (
                  <motion.tr
                    key={pId}
                    variants={fadeSlideUp}
                    className="border-b border-border/30"
                  >
                    <td colSpan={7} className="px-3 py-2">
                      <div
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${
                          isCurrent
                            ? "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 shadow-sm"
                            : "bg-amber-50/80"
                        }`}
                      >
                        {pType === "lunch" ? (
                          <Utensils className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Coffee className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-sm font-semibold text-amber-700">
                          {period.label ?? period.name ?? "Break"}
                        </span>
                        <span className="text-xs text-amber-500 ml-1">
                          {formatTime(period.start_time ?? period.startTime ?? "")} &ndash;{" "}
                          {formatTime(period.end_time ?? period.endTime ?? "")}
                        </span>
                        {isCurrent && (
                          <Badge className="ml-auto bg-amber-500 text-white text-[10px] px-2 border-0">
                            Now
                          </Badge>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              }

              return (
                <motion.tr
                  key={pId}
                  variants={fadeSlideUp}
                  className={`border-b border-border/30 transition-all duration-300 ${
                    isCurrent
                      ? "bg-brand-primary/[0.03] ring-1 ring-inset ring-brand-primary/20"
                      : ""
                  }`}
                >
                  {/* Period label cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="flex h-2.5 w-2.5 shrink-0">
                          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-brand-primary opacity-50" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary" />
                        </span>
                      )}
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent ? "text-brand-primary" : "text-foreground"
                          }`}
                        >
                          {period.label ?? period.name ?? "Period"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatTime(period.start_time ?? period.startTime ?? "")} &ndash;{" "}
                          {formatTime(period.end_time ?? period.endTime ?? "")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {DAYS.map((day) => {
                    const isToday = day === todayKey;
                    const slot = slotMap[`${pId}-${day}`];
                    const isFilled = !!slot;
                    const subjectId = String(
                      slot?.subject_id ?? slot?.subjectId ?? ""
                    );
                    const subjectName =
                      slot?.subject_name ?? slot?.subjectName ?? "";
                    const className =
                      slot?.class_name ?? slot?.className ?? "";
                    const sectionName =
                      slot?.section_name ?? slot?.sectionName ?? "";
                    const classLabel =
                      className && sectionName
                        ? `${className}-${sectionName}`
                        : className || sectionName || "";

                    if (isFilled) {
                      const color = getSubjectColor(subjectId, subjectIds);
                      return (
                        <td
                          key={day}
                          className={`px-1.5 py-1.5 ${
                            isToday ? "bg-brand-primary/[0.03]" : ""
                          }`}
                        >
                          <motion.div
                            variants={cellPop}
                            whileHover={{ scale: 1.04, y: -1 }}
                            className={`rounded-xl border px-3 py-2.5 transition-shadow hover:shadow-md ${color.bg} ${color.border} ${
                              isCurrent && isToday
                                ? "ring-2 ring-brand-primary/30 shadow-md"
                                : ""
                            }`}
                          >
                            <p
                              className={`text-xs font-bold ${color.text} truncate leading-tight`}
                            >
                              {subjectName}
                            </p>
                            {classLabel && (
                              <p className="text-[10px] text-gray-500 mt-1 truncate">
                                {classLabel}
                              </p>
                            )}
                          </motion.div>
                        </td>
                      );
                    }

                    // Empty cell
                    return (
                      <td
                        key={day}
                        className={`px-1.5 py-1.5 ${
                          isToday ? "bg-brand-primary/[0.03]" : ""
                        }`}
                      >
                        <div className="rounded-xl border border-dashed border-border/40 px-3 py-3 text-center">
                          <span className="text-[10px] text-muted-foreground/40">
                            --
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatsCards({
  totalPeriods,
  filledSlots,
  uniqueSubjects,
  uniqueSections,
  isLoading,
}: {
  totalPeriods: number;
  filledSlots: number;
  uniqueSubjects: number;
  uniqueSections: number;
  isLoading: boolean;
}) {
  const stats = [
    {
      label: "Periods/Day",
      value: totalPeriods,
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-100",
    },
    {
      label: "Weekly Slots",
      value: filledSlots,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-100",
    },
    {
      label: "Subjects",
      value: uniqueSubjects,
      icon: BookOpen,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-100",
    },
    {
      label: "Sections",
      value: uniqueSections,
      icon: Sparkles,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      borderColor: "border-sky-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={fadeSlideUp}
          whileHover={{ scale: 1.03, y: -2 }}
        >
          <Card
            className={`relative overflow-hidden border ${stat.borderColor} bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.bgColor} shadow-sm`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
            <div
              className={`pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-3/4 rounded-full blur-xl opacity-30 ${stat.bgColor}`}
            />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherTimetablePage() {
  // Data hooks
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const { data: assignmentsRaw, isLoading: assignmentsLoading } =
    useTeacherAssignments(teacherId);
  const { data: periodsRaw, isLoading: periodsLoading } =
    usePeriodDefinitions();

  // Derived data
  const assignments = useMemo(
    () => extractArray(assignmentsRaw),
    [assignmentsRaw]
  );
  const periods = useMemo(() => {
    const raw = extractArray(periodsRaw);
    return raw.sort((a: any, b: any) => {
      const timeA = a.start_time || a.startTime || "00:00";
      const timeB = b.start_time || b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [periodsRaw]);

  // Unique subject IDs for color assignment
  const subjectIds = useMemo(() => {
    const seen = new Set<string>();
    assignments.forEach((a: any) => {
      const sid = String(a.subject_id ?? a.subjectId ?? "");
      if (sid) seen.add(sid);
    });
    return Array.from(seen);
  }, [assignments]);

  // Subject name lookup map
  const subjectMap = useMemo(() => {
    const map: Record<string, string> = {};
    assignments.forEach((a: any) => {
      const sid = String(a.subject_id ?? a.subjectId ?? "");
      const name = a.subject_name ?? a.subjectName ?? "";
      if (sid && name) map[sid] = name;
    });
    return map;
  }, [assignments]);

  // Stats
  const classPeriods = periods.filter(
    (p: any) => (p.period_type ?? "class") === "class"
  );

  const uniqueSections = useMemo(() => {
    const seen = new Set<string>();
    assignments.forEach((a: any) => {
      const key = `${a.class_id ?? ""}-${a.section_id ?? ""}`;
      seen.add(key);
    });
    return seen.size;
  }, [assignments]);

  // Count filled slots (assignments that have day + period mapping)
  const filledSlotCount = useMemo(() => {
    return assignments.filter((a: any) => {
      const day = a.day_of_week ?? a.dayOfWeek ?? a.day ?? "";
      const period =
        a.period_definition_id ?? a.periodDefinitionId ?? a.period_id ?? "";
      return day && period;
    }).length;
  }, [assignments]);

  const isLoading = teacherLoading || assignmentsLoading || periodsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Banner */}
      <PageBanner periodsCount={classPeriods.length} isLoading={isLoading} />

      {/* Stats Cards */}
      <StatsCards
        totalPeriods={classPeriods.length}
        filledSlots={filledSlotCount}
        uniqueSubjects={subjectIds.length}
        uniqueSections={uniqueSections}
        isLoading={isLoading}
      />

      {/* Subject Legend */}
      <SubjectLegend subjectMap={subjectMap} subjectIds={subjectIds} />

      {/* Weekly Grid */}
      <TimetableGrid
        periods={periods}
        assignments={assignments}
        subjectIds={subjectIds}
        isLoading={isLoading}
      />
    </div>
  );
}
