"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractArray } from "@/lib/utils";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import { useStudentAttendance } from "@/hooks/use-student-insights";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Sparkles,
  TrendingUp,
  Sun,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0; // Sunday only (Indian schools often have Sat classes)
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
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Attendance
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Track your child&apos;s attendance record and trends
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Attendance Analytics</span>
        </div>
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

interface SummaryCardDef {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

function SummaryCards({
  items,
  attendancePct,
  isLoading,
}: {
  items: SummaryCardDef[];
  attendancePct: number;
  isLoading: boolean;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setAnimatedPct(attendancePct), 200);
      return () => clearTimeout(timer);
    }
  }, [attendancePct, isLoading]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const ringColor =
    attendancePct >= 75
      ? "#10b981"
      : attendancePct >= 50
      ? "#f59e0b"
      : "#ef4444";

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {/* First 3 are standard cards */}
      {items.slice(0, 3).map((card) => (
        <motion.div key={card.label} variants={fadeSlideUp} whileHover={{ scale: 1.03, y: -2 }}>
          <Card
            className={`relative overflow-hidden border ${card.borderColor} bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {card.label}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.bgColor} shadow-sm`}
                >
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
            <div
              className={`pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 ${card.bgColor}`}
            />
          </Card>
        </motion.div>
      ))}

      {/* Fourth card: Attendance % with ring */}
      <motion.div variants={fadeSlideUp} whileHover={{ scale: 1.03, y: -2 }}>
        <Card className="relative overflow-hidden border border-emerald-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Attendance %
            </p>
            <div className="relative h-20 w-20">
              <div
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: `conic-gradient(${ringColor} ${animatedPct * 3.6}deg, #e5e7eb ${animatedPct * 3.6}deg)`,
                }}
              />
              <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center shadow-inner">
                <span className="text-xl font-extrabold text-foreground">
                  {animatedPct}
                  <span className="text-sm text-muted-foreground">%</span>
                </span>
              </div>
            </div>
            <p
              className="text-[11px] font-semibold mt-2"
              style={{ color: ringColor }}
            >
              {attendancePct >= 75
                ? "Good Standing"
                : attendancePct >= 50
                ? "Needs Improvement"
                : "Critical"}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function CalendarGrid({
  dailyMap,
  year,
  month,
  isLoading,
}: {
  dailyMap: Record<string, string>;
  year: number;
  month: number;
  isLoading: boolean;
}) {
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const statusColor: Record<string, string> = {
    present: "bg-emerald-400",
    absent: "bg-red-400",
    late: "bg-amber-400",
    holiday: "bg-gray-300",
    weekend: "bg-gray-200",
  };

  const statusTooltip: Record<string, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    holiday: "Holiday",
    weekend: "Weekend",
  };

  if (isLoading) {
    return <Skeleton className="h-80 rounded-xl" />;
  }

  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
      <Card className="border border-border/60 bg-white shadow-sm">
        <CardContent className="p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-muted-foreground"
            >
              &lsaquo;
            </button>
            <h3 className="text-base font-bold text-foreground">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            <button
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-muted-foreground"
            >
              &rsaquo;
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-8 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              let status = dailyMap[dateStr] ?? "";
              if (!status && isWeekend(selectedYear, selectedMonth, day)) {
                status = "weekend";
              }
              const today = new Date();
              const isToday =
                today.getFullYear() === selectedYear &&
                today.getMonth() === selectedMonth &&
                today.getDate() === day;

              const dotColor = statusColor[status] ?? "bg-gray-100";
              const tooltip = statusTooltip[status] ?? "No data";

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.01 }}
                  className={`relative flex flex-col items-center justify-center h-9 rounded-lg cursor-default transition-all hover:scale-110 ${
                    isToday ? "ring-2 ring-brand-primary/40" : ""
                  }`}
                  title={`${dateStr}: ${tooltip}`}
                >
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">
                    {day}
                  </span>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${dotColor} ${
                      status === "present"
                        ? "shadow-sm shadow-emerald-200"
                        : status === "absent"
                        ? "shadow-sm shadow-red-200"
                        : status === "late"
                        ? "shadow-sm shadow-amber-200"
                        : ""
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/40">
            {[
              { color: "bg-emerald-400", label: "Present" },
              { color: "bg-red-400", label: "Absent" },
              { color: "bg-amber-400", label: "Late" },
              { color: "bg-gray-300", label: "Holiday" },
              { color: "bg-gray-200", label: "Weekend" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function MonthlyTrendChart({
  attendanceData,
  isLoading,
}: {
  attendanceData: any;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  // Try to extract monthly trend
  const trend =
    attendanceData?.trend ??
    attendanceData?.monthly ??
    attendanceData?.daily ??
    [];
  const trendArr = Array.isArray(trend) ? trend : [];

  // Build monthly chart data from daily data or monthly data
  const chartData = useMemo(() => {
    if (trendArr.length === 0) {
      // Synthesize from summary if no trend
      const total = attendanceData?.total_days ?? attendanceData?.totalDays ?? 0;
      const present = attendanceData?.present_days ?? attendanceData?.presentDays ?? attendanceData?.present ?? 0;
      if (total === 0) return [];
      const pct = Math.round((present / total) * 100);
      const now = new Date();
      // Show last 6 months with the known percentage for current month
      return Array.from({ length: 6 }).map((_, i) => {
        const monthIdx = (now.getMonth() - 5 + i + 12) % 12;
        const isCurrent = i === 5;
        return {
          name: MONTH_SHORT[monthIdx],
          attendance: isCurrent ? pct : 0,
        };
      });
    }

    return trendArr.map((item: any) => ({
      name:
        item.month ??
        item.date ??
        item.label ??
        item.period ??
        "",
      attendance: Number(
        item.percentage ?? item.pct ?? item.attendance_pct ?? 0
      ),
    }));
  }, [trendArr, attendanceData]);

  if (chartData.every((d: any) => d.attendance === 0)) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Not enough data for trend analysis
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Monthly trends will appear as attendance data accumulates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
      <Card className="border border-border/60 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-foreground">
              Monthly Trend
            </h3>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="parentAttFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
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
                  formatter={(value) => [`${value}%`, "Attendance"]}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#parentAttFill)"
                  dot={{
                    r: 4,
                    fill: "#10b981",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#10b981",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ParentAttendancePage() {
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

  // --- Derived data ---
  const totalDays = attendanceRaw?.total_days ?? attendanceRaw?.totalDays ?? 0;
  const presentDays = attendanceRaw?.present_days ?? attendanceRaw?.presentDays ?? attendanceRaw?.present ?? 0;
  const absentDays = attendanceRaw?.absent_days ?? attendanceRaw?.absentDays ?? attendanceRaw?.absent ?? 0;
  const lateDays = attendanceRaw?.late_days ?? attendanceRaw?.lateDays ?? attendanceRaw?.late ?? 0;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Build daily map from attendance records
  const dailyMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    const records = attendanceRaw?.records ?? attendanceRaw?.daily ?? attendanceRaw?.details ?? [];
    const arr = Array.isArray(records) ? records : [];
    arr.forEach((r: any) => {
      const date = r.date ?? r.attendance_date ?? "";
      const status = (r.status ?? r.attendance_status ?? "").toLowerCase();
      if (date && status) {
        // Normalize date to YYYY-MM-DD
        const d = date.slice(0, 10);
        map[d] = status;
      }
    });
    return map;
  }, [attendanceRaw]);

  const now = new Date();

  const summaryCards: SummaryCardDef[] = [
    {
      label: "Present Days",
      value: presentDays,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-100",
    },
    {
      label: "Absent Days",
      value: absentDays,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-100",
    },
    {
      label: "Late Days",
      value: lateDays,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-100",
    },
  ];

  const isLoading = parentLoading || childrenLoading || attendanceLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={parentLoading || childrenLoading} />

      {/* Child Selector */}
      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={(v) => v && setSelectedChildId(v)}
      />

      {/* Summary Cards */}
      <SummaryCards
        items={summaryCards}
        attendancePct={attendancePct}
        isLoading={isLoading}
      />

      {/* Calendar + Trend row */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6"
      >
        {/* Calendar takes more space */}
        <div className="lg:col-span-3">
          <CalendarGrid
            dailyMap={dailyMap}
            year={now.getFullYear()}
            month={now.getMonth()}
            isLoading={attendanceLoading}
          />
        </div>

        {/* Trend chart */}
        <div className="lg:col-span-2">
          <MonthlyTrendChart
            attendanceData={attendanceRaw}
            isLoading={attendanceLoading}
          />
        </div>
      </motion.div>
    </div>
  );
}
