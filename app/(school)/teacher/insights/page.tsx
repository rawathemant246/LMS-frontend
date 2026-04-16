"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  Users,
  Brain,
  TrendingUp,
  CalendarCheck,
  MessageSquare,
  AlertTriangle,
  Star,
  Search,
  GraduationCap,
  Sparkles,
  Activity,
  Eye,
  Clock,
} from "lucide-react";
import { extractArray } from "@/lib/utils";
import {
  useTeacherProfile,
  useMyClasses,
} from "@/hooks/use-teacher-context";
import { useSectionStudents } from "@/hooks/use-attendance";
import {
  useStudentMastery,
  useStudentGradebook,
  useStudentAttendance,
  useTutorSessions,
} from "@/hooks/use-student-insights";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ---------------------------------------------------------------------------
// Mastery color helpers
// ---------------------------------------------------------------------------

function getMasteryColor(level: number): string {
  if (level < 40) return "bg-red-500";
  if (level < 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function getMasteryBg(level: number): string {
  if (level < 40) return "bg-red-50 border-red-200";
  if (level < 70) return "bg-amber-50 border-amber-200";
  return "bg-emerald-50 border-emerald-200";
}

function getMasteryText(level: number): string {
  if (level < 40) return "text-red-700";
  if (level < 70) return "text-amber-700";
  return "text-emerald-700";
}

function getMasteryLabel(level: number): string {
  if (level < 40) return "Needs Attention";
  if (level < 70) return "Developing";
  return "Proficient";
}

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

const ATTENDANCE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-8 md:p-10 text-white mb-8"
    >
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 25%, white 1px, transparent 1px)",
          backgroundSize: "50px 50px, 65px 65px",
        }}
      />
      {/* Floating orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/10">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Student Insights
            </h1>
            <p className="text-sm text-white/70 font-medium mt-0.5">
              Deep-dive into individual student performance
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Selector bar
// ---------------------------------------------------------------------------

function SelectorBar({
  classes,
  students,
  selectedSection,
  selectedStudent,
  onSectionChange,
  onStudentChange,
  studentsLoading,
}: {
  classes: any[];
  students: any[];
  selectedSection: string;
  selectedStudent: string;
  onSectionChange: (v: string) => void;
  onStudentChange: (v: string) => void;
  studentsLoading: boolean;
}) {
  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate" className="mb-8">
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Class-Section dropdown */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Class & Section
              </label>
              <Select value={selectedSection} onValueChange={(v) => onSectionChange(v ?? "")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select class-section" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.section_id} value={c.section_id}>
                      {c.class_name} - {c.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student dropdown */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Student
              </label>
              <Select
                value={selectedStudent}
                onValueChange={(v) => onStudentChange(v ?? "")}
                disabled={!selectedSection || studentsLoading}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue
                    placeholder={
                      !selectedSection
                        ? "Select class first"
                        : studentsLoading
                        ? "Loading students..."
                        : "Select student"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                      {s.roll_number ? ` (Roll ${s.roll_number})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mastery Heatmap
// ---------------------------------------------------------------------------

function MasteryHeatmap({ studentId }: { studentId: string }) {
  const { data: masteryRaw, isLoading } = useStudentMastery(studentId);
  const concepts = useMemo(() => extractArray(masteryRaw), [masteryRaw]);

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Concept Mastery</h3>
          </div>

          {concepts.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No mastery data available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {concepts.map((concept: any, i: number) => {
                  const level =
                    concept.mastery_level ??
                    concept.mastery_percentage ??
                    concept.score ??
                    0;
                  return (
                    <motion.div
                      key={concept.id ?? i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className={`relative overflow-hidden rounded-lg border p-3 ${getMasteryBg(level)} transition-all duration-300 hover:shadow-sm`}
                    >
                      <p className="text-xs font-semibold text-foreground truncate mb-1.5">
                        {concept.concept_name ?? concept.topic_name ?? concept.name ?? "Concept"}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(level, 100)}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${getMasteryColor(level)}`}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${getMasteryText(level)}`}>
                          {Math.round(level)}%
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 font-medium ${getMasteryText(level)}`}>
                        {getMasteryLabel(level)}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">70%+ Proficient</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground">40-70% Developing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-[10px] text-muted-foreground">&lt;40% Needs Attention</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Performance Trend
// ---------------------------------------------------------------------------

function PerformanceTrend({ studentId }: { studentId: string }) {
  const { data: gradebookRaw, isLoading } = useStudentGradebook(studentId);
  const records = useMemo(() => {
    const items = extractArray(gradebookRaw);
    return items.map((r: any) => ({
      name:
        r.exam_name ??
        r.assessment_name ??
        r.name ??
        r.title ??
        "Exam",
      score:
        r.percentage ?? r.score ?? r.marks_obtained ?? 0,
      total: r.total_marks ?? r.max_marks ?? 100,
    }));
  }, [gradebookRaw]);

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Performance Trend</h3>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No exam records found</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={records} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#scoreGradient)"
                    dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Attendance Summary
// ---------------------------------------------------------------------------

function AttendanceSummary({ studentId }: { studentId: string }) {
  const { data: attendanceRaw, isLoading } = useStudentAttendance(studentId);

  const stats = useMemo(() => {
    const items = extractArray(attendanceRaw);
    // Could be aggregate or array of daily records
    if (items.length === 0 && attendanceRaw) {
      // Maybe it's an object with summary
      const d = (attendanceRaw as any)?.data ?? attendanceRaw;
      return {
        present: d?.present_count ?? d?.present ?? d?.total_present ?? 0,
        absent: d?.absent_count ?? d?.absent ?? d?.total_absent ?? 0,
        late: d?.late_count ?? d?.late ?? d?.total_late ?? 0,
      };
    }
    // Count from daily records
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const r of items) {
      const status = (r.status ?? "").toLowerCase();
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late" || status === "tardy") late++;
    }
    return { present, absent, late };
  }, [attendanceRaw]);

  const total = stats.present + stats.absent + stats.late;
  const percentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;

  const chartData = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent },
    { name: "Late", value: stats.late },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Attendance Summary</h3>
          </div>

          {total === 0 ? (
            <div className="text-center py-8">
              <CalendarCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No attendance records</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Donut chart */}
              <div className="relative h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-foreground">{percentage}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Present</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="text-center rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                  <p className="text-lg font-bold text-emerald-700">{stats.present}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Present</p>
                </div>
                <div className="text-center rounded-lg bg-red-50 border border-red-200 p-2">
                  <p className="text-lg font-bold text-red-700">{stats.absent}</p>
                  <p className="text-[10px] text-red-600 font-medium">Absent</p>
                </div>
                <div className="text-center rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <p className="text-lg font-bold text-amber-700">{stats.late}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Late</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AI Tutor Sessions
// ---------------------------------------------------------------------------

function TutorSessionsList({ studentId }: { studentId: string }) {
  const { data: sessionsRaw, isLoading } = useTutorSessions();
  const sessions = useMemo(() => {
    const all = extractArray(sessionsRaw);
    // Filter by student if possible
    const filtered = all.filter(
      (s: any) => s.student_id === studentId || s.user_id === studentId
    );
    return filtered.length > 0 ? filtered : all.slice(0, 10);
  }, [sessionsRaw, studentId]);

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground">AI Tutor Sessions</h3>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No tutor sessions found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sessions.map((session: any, i: number) => {
                const rating = session.rating ?? session.score ?? null;
                const messageCount =
                  session.message_count ?? session.messages_count ?? session.total_messages ?? 0;
                const topic =
                  session.concept_name ??
                  session.topic ??
                  session.subject ??
                  "General";
                const dateStr = session.created_at ?? session.date ?? "";
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "";

                return (
                  <motion.div
                    key={session.id ?? i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gradient-to-r from-white to-gray-50/50 p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{topic}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {messageCount > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {messageCount} msgs
                          </span>
                        )}
                        {formattedDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    </div>
                    {rating !== null && rating !== undefined && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3 w-3 ${
                              j < rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function Recommendations({ studentId }: { studentId: string }) {
  const { data: masteryRaw, isLoading } = useStudentMastery(studentId);
  const weakConcepts = useMemo(() => {
    const items = extractArray(masteryRaw);
    return items
      .filter((c: any) => {
        const level =
          c.mastery_level ?? c.mastery_percentage ?? c.score ?? 0;
        return level < 50;
      })
      .sort(
        (a: any, b: any) =>
          (a.mastery_level ?? a.mastery_percentage ?? a.score ?? 0) -
          (b.mastery_level ?? b.mastery_percentage ?? b.score ?? 0)
      )
      .slice(0, 6);
  }, [masteryRaw]);

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-amber-200/50 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-red-500">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Focus Areas</h3>
            {weakConcepts.length > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                {weakConcepts.length} concept(s)
              </Badge>
            )}
          </div>

          {weakConcepts.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 mx-auto mb-2">
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-xs text-emerald-700 font-semibold">Great progress!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                No weak concepts detected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {weakConcepts.map((concept: any, i: number) => {
                const level =
                  concept.mastery_level ?? concept.mastery_percentage ?? concept.score ?? 0;
                const name =
                  concept.concept_name ?? concept.topic_name ?? concept.name ?? "Concept";
                return (
                  <motion.div
                    key={concept.id ?? i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      level < 30
                        ? "border-red-200 bg-red-50/60"
                        : "border-amber-200 bg-amber-50/60"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 ${
                        level < 30 ? "text-red-500" : "text-amber-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                      <p className={`text-[10px] font-medium ${level < 30 ? "text-red-600" : "text-amber-600"}`}>
                        {Math.round(level)}% mastery - Needs focused practice
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-center py-20"
    >
      <div className="relative inline-block">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto shadow-sm border border-indigo-200/50">
          <Search className="h-9 w-9 text-indigo-400" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-indigo-200/20 blur-2xl -z-10" />
      </div>
      <h3 className="text-base font-bold text-foreground mt-6">Select a student to view insights</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
        Choose a class-section and student from the selectors above to explore their performance, mastery levels, attendance, and AI tutor activity
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentInsightsPage() {
  const { data: teacher } = useTeacherProfile();
  const teacherId = teacher?.id;
  const myClasses = useMyClasses(teacherId);

  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const { data: studentsRaw, isLoading: studentsLoading } = useSectionStudents(
    selectedSection || undefined
  );
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  const handleSectionChange = (v: string) => {
    setSelectedSection(v);
    setSelectedStudent("");
  };

  const selectedStudentObj = students.find((s: any) => s.id === selectedStudent);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader />

      {/* Selector Bar */}
      <SelectorBar
        classes={myClasses}
        students={students}
        selectedSection={selectedSection}
        selectedStudent={selectedStudent}
        onSectionChange={handleSectionChange}
        onStudentChange={setSelectedStudent}
        studentsLoading={studentsLoading}
      />

      {/* Student name badge when selected */}
      <AnimatePresence>
        {selectedStudentObj && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 via-white to-violet-50 border border-indigo-200/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-violet-600 text-white text-sm font-bold shadow-sm">
                {(selectedStudentObj.first_name?.[0] ?? "").toUpperCase()}
                {(selectedStudentObj.last_name?.[0] ?? "").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {selectedStudentObj.first_name} {selectedStudentObj.last_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedStudentObj.roll_number ? `Roll No. ${selectedStudentObj.roll_number}` : "Student"}
                  {selectedStudentObj.admission_number ? ` | Adm. ${selectedStudentObj.admission_number}` : ""}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight panels */}
      {selectedStudent ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MasteryHeatmap studentId={selectedStudent} />
            <PerformanceTrend studentId={selectedStudent} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceSummary studentId={selectedStudent} />
            <TutorSessionsList studentId={selectedStudent} />
          </div>

          {/* Recommendations - full width */}
          <Recommendations studentId={selectedStudent} />
        </motion.div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
