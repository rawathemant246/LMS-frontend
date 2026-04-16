"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import {
  useStudentMastery,
  useStudentGradebook,
  useStudentAttendance,
} from "@/hooks/use-student-insights";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Brain,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Sparkles,
  Target,
  Award,
} from "lucide-react";

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

const cellReveal: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMasteryColor(pct: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (pct >= 70)
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Strong",
    };
  if (pct >= 40)
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "Developing",
    };
  return {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    label: "Needs Work",
  };
}

function computeOverallMastery(concepts: any[]): number {
  if (concepts.length === 0) return 0;
  const sum = concepts.reduce((acc: number, c: any) => {
    const pct =
      c.mastery_pct ?? c.masteryPct ?? c.mastery ?? c.percentage ?? 0;
    return acc + Number(pct);
  }, 0);
  return Math.round(sum / concepts.length);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageBanner({ isLoading }: { isLoading: boolean }) {
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

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                My Progress
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Track your learning journey across all subjects
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Analytics Dashboard</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function OverallMasteryRing({
  percentage,
  isLoading,
}: {
  percentage: number;
  isLoading: boolean;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setAnimatedPct(percentage), 200);
      return () => clearTimeout(timer);
    }
  }, [percentage, isLoading]);

  if (isLoading) {
    return <Skeleton className="h-56 w-56 rounded-full mx-auto" />;
  }

  const ringColor =
    percentage >= 70
      ? "#10b981"
      : percentage >= 40
      ? "#f59e0b"
      : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative h-52 w-52">
        {/* Background ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${ringColor} ${animatedPct * 3.6}deg, #e5e7eb ${animatedPct * 3.6}deg)`,
            transition: "background 1s ease-out",
          }}
        />
        {/* Inner white circle */}
        <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="text-5xl font-extrabold tracking-tight text-foreground">
            {animatedPct}
            <span className="text-2xl text-muted-foreground">%</span>
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
            Overall Mastery
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Award className="h-4 w-4" style={{ color: ringColor }} />
        <span
          className="text-sm font-bold"
          style={{ color: ringColor }}
        >
          {percentage >= 70
            ? "Excellent Progress"
            : percentage >= 40
            ? "Good Start, Keep Going"
            : "Let's Build Momentum"}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ConceptMasteryHeatmap({
  concepts,
  isLoading,
}: {
  concepts: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No concept mastery data available yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Complete assignments and exams to track concept mastery
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
    >
      {concepts.map((concept: any, index: number) => {
        const name =
          concept.concept_name ??
          concept.conceptName ??
          concept.name ??
          concept.topic ??
          "Concept";
        const pct =
          concept.mastery_pct ??
          concept.masteryPct ??
          concept.mastery ??
          concept.percentage ??
          0;
        const pctNum = Number(pct);
        const color = getMasteryColor(pctNum);

        return (
          <motion.div
            key={concept.id ?? concept.concept_id ?? index}
            variants={cellReveal}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <div
              className={`rounded-xl border ${color.border} ${color.bg} p-3.5 transition-shadow hover:shadow-md h-full`}
            >
              <p
                className={`text-xs font-bold ${color.text} leading-tight line-clamp-2 mb-2`}
              >
                {name}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-extrabold ${color.text}`}>
                  {pctNum}%
                </span>
                <Badge
                  variant="outline"
                  className={`border-transparent text-[9px] px-1.5 ${color.bg} ${color.text}`}
                >
                  {color.label}
                </Badge>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function GradeTrendsChart({
  grades,
  isLoading,
}: {
  grades: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  if (grades.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No grade data available yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Grades will appear here after exams are scored
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = grades.map((g: any) => ({
    name:
      g.exam_name ??
      g.examName ??
      g.title ??
      g.name ??
      "Exam",
    score: Number(
      g.percentage ??
        g.score_pct ??
        g.scorePct ??
        g.marks_obtained ??
        g.marksObtained ??
        0
    ),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, "Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6366F1"
            strokeWidth={2.5}
            fill="url(#gradeFill)"
            dot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SubjectBreakdown({
  concepts,
  isLoading,
}: {
  concepts: any[];
  isLoading: boolean;
}) {
  const subjectData = useMemo(() => {
    const map: Record<string, { total: number; count: number; name: string }> = {};
    concepts.forEach((c: any) => {
      const subjectName =
        c.subject_name ?? c.subjectName ?? c.subject ?? "General";
      const pct =
        c.mastery_pct ??
        c.masteryPct ??
        c.mastery ??
        c.percentage ??
        0;
      if (!map[subjectName]) {
        map[subjectName] = { total: 0, count: 0, name: subjectName };
      }
      map[subjectName].total += Number(pct);
      map[subjectName].count += 1;
    });
    return Object.values(map).map((s) => ({
      ...s,
      avg: Math.round(s.total / s.count),
    }));
  }, [concepts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (subjectData.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No subject breakdown data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const subjectGradients = [
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-sky-500",
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {subjectData.map((subject, index) => {
        const color = getMasteryColor(subject.avg);
        const gradient =
          subjectGradients[index % subjectGradients.length];

        return (
          <motion.div
            key={subject.name}
            variants={fadeSlideUp}
            whileHover={{ scale: 1.03, y: -2 }}
          >
            <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {subject.name}
                    </p>
                    <p className="text-3xl font-extrabold tracking-tight text-foreground">
                      {subject.avg}%
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
                  >
                    <BookOpen className="h-4.5 w-4.5 text-white" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.avg}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                  />
                </div>
                <p className={`text-[11px] font-semibold mt-2 ${color.text}`}>
                  {color.label} -- {subject.count} concepts tracked
                </p>
              </CardContent>
              <div
                className={`pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-20 bg-gradient-to-r ${gradient}`}
              />
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function AttendanceTrendChart({
  attendanceData,
  isLoading,
}: {
  attendanceData: any;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  // Try to extract daily/monthly trend data
  const trend = attendanceData?.trend ?? attendanceData?.daily ?? attendanceData?.monthly ?? [];
  const trendArr = Array.isArray(trend) ? trend : [];

  // Fallback: if no trend, show summary
  if (trendArr.length === 0) {
    const total =
      attendanceData?.total_days ?? attendanceData?.totalDays ?? 0;
    const present =
      attendanceData?.present_days ??
      attendanceData?.presentDays ??
      attendanceData?.present ??
      0;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    return (
      <div className="flex items-center gap-6 py-4">
        <div className="relative h-28 w-28 shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#10b981 ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`,
            }}
          />
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
            <span className="text-2xl font-extrabold text-foreground">
              {pct}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {present} / {total} days present
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pct >= 75 ? "Great attendance record!" : "Try to improve your attendance"}
          </p>
        </div>
      </div>
    );
  }

  const chartData = trendArr.map((item: any) => ({
    name:
      item.date ??
      item.month ??
      item.label ??
      item.period ??
      "",
    attendance: Number(
      item.percentage ?? item.pct ?? item.attendance_pct ?? 0
    ),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, "Attendance"]}
          />
          <Area
            type="monotone"
            dataKey="attendance"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#attendanceFill)"
            dot={{ r: 3, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeSlideUp}>
      <Card className="border border-border/60 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentProgressPage() {
  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id;

  const { data: masteryRaw, isLoading: masteryLoading } =
    useStudentMastery(studentId);
  const { data: gradebookRaw, isLoading: gradebookLoading } =
    useStudentGradebook(studentId);
  const { data: attendanceRaw, isLoading: attendanceLoading } =
    useStudentAttendance(studentId);

  const concepts = useMemo(
    () => extractArray(masteryRaw),
    [masteryRaw]
  );
  const grades = useMemo(
    () => extractArray(gradebookRaw),
    [gradebookRaw]
  );

  const overallMastery = useMemo(
    () => computeOverallMastery(concepts),
    [concepts]
  );

  const isLoading = studentLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      {/* Overall Mastery + Subject Breakdown row */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
      >
        {/* Overall Mastery Ring */}
        <motion.div variants={fadeSlideUp}>
          <Card className="border border-border/60 bg-white shadow-sm h-full">
            <CardContent className="p-6 flex items-center justify-center">
              <OverallMasteryRing
                percentage={overallMastery}
                isLoading={masteryLoading}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Grade Trends */}
        <motion.div variants={fadeSlideUp} className="lg:col-span-2">
          <Card className="border border-border/60 bg-white shadow-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-foreground">
                  Grade Trends
                </h2>
              </div>
              <GradeTrendsChart
                grades={grades}
                isLoading={gradebookLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Concept Mastery Heatmap */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-6"
      >
        <SectionCard
          title="Concept Mastery"
          icon={Target}
          iconColor="text-violet-500"
        >
          <ConceptMasteryHeatmap
            concepts={concepts}
            isLoading={masteryLoading}
          />
        </SectionCard>
      </motion.div>

      {/* Subject Breakdown + Attendance row */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
      >
        <motion.div variants={fadeSlideUp} className="lg:col-span-2">
          <Card className="border border-border/60 bg-white shadow-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-foreground">
                  Subject Breakdown
                </h2>
              </div>
              <SubjectBreakdown
                concepts={concepts}
                isLoading={masteryLoading}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeSlideUp}>
          <Card className="border border-border/60 bg-white shadow-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <CalendarCheck className="h-5 w-5 text-teal-500" />
                <h2 className="text-lg font-bold text-foreground">
                  Attendance
                </h2>
              </div>
              <AttendanceTrendChart
                attendanceData={attendanceRaw}
                isLoading={attendanceLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
