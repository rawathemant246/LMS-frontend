"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ClipboardCheck,
  CheckCircle2,
  Users,
  CalendarDays,
  Sparkles,
  AlertCircle,
  Save,
  RotateCcw,
  Search,
} from "lucide-react";
import { useTeacherProfile, useMyClasses } from "@/hooks/use-teacher-context";
import {
  useSectionStudents,
  useMarkAttendance,
  useAttendance,
} from "@/hooks/use-attendance";

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

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

const STATUS_CONFIG: {
  key: AttendanceStatus;
  label: string;
  shortLabel: string;
  activeClasses: string;
  activeBg: string;
  glowColor: string;
  icon: string;
}[] = [
  {
    key: "present",
    label: "Present",
    shortLabel: "P",
    activeClasses: "bg-emerald-500 text-white shadow-emerald-200",
    activeBg: "bg-emerald-500",
    glowColor: "bg-emerald-400",
    icon: "check",
  },
  {
    key: "absent",
    label: "Absent",
    shortLabel: "A",
    activeClasses: "bg-rose-500 text-white shadow-rose-200",
    activeBg: "bg-rose-500",
    glowColor: "bg-rose-400",
    icon: "x",
  },
  {
    key: "late",
    label: "Late",
    shortLabel: "L",
    activeClasses: "bg-amber-500 text-white shadow-amber-200",
    activeBg: "bg-amber-500",
    glowColor: "bg-amber-400",
    icon: "clock",
  },
  {
    key: "half_day",
    label: "Half Day",
    shortLabel: "HD",
    activeClasses: "bg-orange-500 text-white shadow-orange-200",
    activeBg: "bg-orange-500",
    glowColor: "bg-orange-400",
    icon: "half",
  },
];

const INACTIVE_CLASSES =
  "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80 border border-transparent";

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const rowSlide: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

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
      {/* Mesh overlay */}
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
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-56 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Attendance
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-40 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Mark daily attendance for your assigned sections
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function CompletionStatus({
  myClasses,
  markedSections,
}: {
  myClasses: any[];
  markedSections: Set<string>;
}) {
  const total = myClasses.length;
  const marked = myClasses.filter((c) => {
    const sectionId = String(c.section_id ?? c.id ?? "");
    return markedSections.has(sectionId);
  }).length;
  const pct = total > 0 ? (marked / total) * 100 : 0;

  return (
    <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
      <Card className="border-border/60 bg-gradient-to-r from-white to-gray-50/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
              pct === 100
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {pct === 100 ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {marked} of {total} sections marked today
            </p>
            <div className="mt-1.5 h-2 w-full max-w-xs rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pct === 100 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
          {pct === 100 && (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              All Done
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function SectionSelector({
  myClasses,
  selectedSectionId,
  onSelect,
}: {
  myClasses: any[];
  selectedSectionId: string;
  onSelect: (id: string | null) => void;
}) {
  if (myClasses.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Section
      </Label>
      <Select value={selectedSectionId} onValueChange={onSelect}>
        <SelectTrigger className="w-56 bg-white/80 backdrop-blur-sm border-border/60 shadow-sm">
          <SelectValue placeholder="Choose a section" />
        </SelectTrigger>
        <SelectContent>
          {myClasses.map((cls: any) => {
            const sectionId = String(cls.section_id ?? cls.id ?? "");
            const className = cls.class_name ?? cls.className ?? "";
            const sectionName = cls.section_name ?? cls.sectionName ?? "";
            return (
              <SelectItem key={sectionId} value={sectionId}>
                {className} &mdash; {sectionName}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StudentAttendanceGrid({
  sectionId,
  selectedDate,
  attendanceMap,
  onToggle,
  searchQuery,
}: {
  sectionId: string;
  selectedDate: string;
  attendanceMap: Record<string, AttendanceStatus>;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
  searchQuery: string;
}) {
  const { data: studentsRaw, isLoading } = useSectionStudents(
    sectionId || undefined
  );
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s: any) => {
      const name =
        s.full_name ??
        s.name ??
        `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
      return name.toLowerCase().includes(q);
    });
  }, [students, searchQuery]);

  // Default all to present on load
  useEffect(() => {
    if (students.length === 0) return;
    students.forEach((s: any) => {
      const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
      if (id && !attendanceMap[id]) {
        onToggle(id, "present");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border/40 bg-white p-4"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-9 w-12 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {students.length === 0
              ? "No students found in this section"
              : "No students match your search"}
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
      className="space-y-2"
    >
      {filtered.map((s: any, idx: number) => {
        const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
        const name =
          s.full_name ??
          s.name ??
          `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() ??
          s.data?.full_name ??
          "Unnamed";
        const rollNo =
          s.roll_number ??
          s.admission_number ??
          s.data?.roll_number ??
          idx + 1;
        const currentStatus: AttendanceStatus =
          attendanceMap[id] ?? "present";

        return (
          <motion.div
            key={id || idx}
            variants={rowSlide}
            className="group relative flex items-center gap-4 rounded-xl border border-border/40 bg-white p-3 md:p-4 hover:shadow-md hover:border-border/80 transition-all duration-200"
          >
            {/* Status indicator bar */}
            <div
              className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors duration-300 ${
                STATUS_CONFIG.find((c) => c.key === currentStatus)?.activeBg ??
                "bg-gray-200"
              }`}
            />

            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-violet-500 text-white text-sm font-bold shadow-sm ml-2">
              {name.charAt(0).toUpperCase()}
            </div>

            {/* Name + roll */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Roll #{rollNo}
              </p>
            </div>

            {/* Status buttons */}
            <div className="flex gap-1.5">
              {STATUS_CONFIG.map((cfg) => {
                const isActive = currentStatus === cfg.key;
                return (
                  <motion.button
                    key={cfg.key}
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onToggle(id, cfg.key)}
                    className={`relative h-9 min-w-[2.75rem] px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? `${cfg.activeClasses} shadow-md border border-white/20`
                        : INACTIVE_CLASSES
                    }`}
                    title={cfg.label}
                  >
                    {cfg.shortLabel}
                    {isActive && (
                      <motion.div
                        layoutId={`glow-${id}`}
                        className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3/4 rounded-full blur-sm opacity-60 ${cfg.glowColor}`}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function SummaryFooter({
  attendanceMap,
  onSubmit,
  onReset,
  isPending,
  studentCount,
}: {
  attendanceMap: Record<string, AttendanceStatus>;
  onSubmit: () => void;
  onReset: () => void;
  isPending: boolean;
  studentCount: number;
}) {
  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
    };
    Object.values(attendanceMap).forEach((s) => {
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [attendanceMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="sticky bottom-0 z-10"
    >
      <div className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-xl shadow-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Status summary pills */}
        <div className="flex flex-wrap items-center gap-3">
          {STATUS_CONFIG.map((cfg) => (
            <div
              key={cfg.key}
              className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 border border-border/40"
            >
              <span
                className={`inline-flex h-6 w-8 items-center justify-center rounded text-[11px] font-bold ${cfg.activeClasses}`}
              >
                {cfg.shortLabel}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {counts[cfg.key]}
              </span>
            </div>
          ))}
          <div className="text-xs text-muted-foreground">
            of {studentCount} students
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset All
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isPending || studentCount === 0}
            className="bg-gradient-to-r from-brand-primary to-violet-600 hover:from-brand-primary/90 hover:to-violet-600/90 text-white shadow-md shadow-brand-primary/20"
          >
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-3.5 w-3.5 mr-1.5 border-2 border-white/30 border-t-white rounded-full"
                />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Submit Attendance
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherAttendancePage() {
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [markedSections] = useState<Set<string>>(new Set());

  // Data hooks
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const myClasses = useMyClasses(teacherId);
  const markMutation = useMarkAttendance();

  // Load existing attendance for selected section + date
  const { data: existingAttendance } = useAttendance(
    selectedSectionId || undefined,
    selectedDate || undefined
  );

  // Pre-fill from existing attendance data
  useEffect(() => {
    if (!existingAttendance) return;
    const records = extractArray(existingAttendance);
    if (records.length === 0) return;
    const map: Record<string, AttendanceStatus> = {};
    records.forEach((r: any) => {
      const sid = String(r.student_id ?? r.id ?? "");
      const status = (r.status ?? "present") as AttendanceStatus;
      if (sid) map[sid] = status;
    });
    setAttendanceMap(map);
  }, [existingAttendance]);

  // Reset map when section changes
  useEffect(() => {
    setAttendanceMap({});
  }, [selectedSectionId]);

  // Students for count
  const { data: studentsRaw } = useSectionStudents(
    selectedSectionId || undefined
  );
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  const handleStatusToggle = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    },
    []
  );

  const handleResetAll = useCallback(() => {
    const resetMap: Record<string, AttendanceStatus> = {};
    students.forEach((s: any) => {
      const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
      if (id) resetMap[id] = "present";
    });
    setAttendanceMap(resetMap);
  }, [students]);

  const handleSubmit = () => {
    if (!selectedSectionId || !selectedDate) return;
    markMutation.mutate(
      {
        section_id: selectedSectionId,
        date: selectedDate,
        records: students.map((s: any) => {
          const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
          return { student_id: id, status: attendanceMap[id] ?? "present" };
        }),
      },
      {
        onSuccess: () => {
          markedSections.add(selectedSectionId);
        },
      }
    );
  };

  const showGrid = !!selectedSectionId && !!selectedDate;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Banner */}
      <PageBanner isLoading={teacherLoading} />

      {/* Completion Status */}
      {myClasses.length > 0 && (
        <div className="mb-6">
          <CompletionStatus
            myClasses={myClasses}
            markedSections={markedSections}
          />
        </div>
      )}

      {/* Filter Bar */}
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-5 mb-6 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-5">
          <SectionSelector
            myClasses={myClasses}
            selectedSectionId={selectedSectionId}
            onSelect={(id) => {
              setSelectedSectionId(id ?? "");
              setSearchQuery("");
            }}
          />

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Date
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44 bg-white/80 backdrop-blur-sm border-border/60 shadow-sm"
            />
          </div>

          {showGrid && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Search Student
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Type to filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/80 backdrop-blur-sm border-border/60 shadow-sm"
                />
              </div>
            </div>
          )}

          {selectedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">{formatDateLabel(selectedDate)}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status legend */}
      {showGrid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground"
        >
          <span className="font-semibold text-foreground">Legend:</span>
          {STATUS_CONFIG.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 border border-border/30"
            >
              <span
                className={`inline-flex h-5 w-7 items-center justify-center rounded text-[10px] font-bold ${s.activeClasses}`}
              >
                {s.shortLabel}
              </span>
              {s.label}
            </span>
          ))}
        </motion.div>
      )}

      {/* Grid or Empty State */}
      <AnimatePresence mode="wait">
        {!showGrid ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
                  <ClipboardCheck className="h-8 w-8 text-brand-primary/60" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1.5">
                  Select a section to begin
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Choose one of your assigned class sections and a date to start
                  marking attendance.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedSectionId}-${selectedDate}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4 pb-24"
          >
            <StudentAttendanceGrid
              sectionId={selectedSectionId}
              selectedDate={selectedDate}
              attendanceMap={attendanceMap}
              onToggle={handleStatusToggle}
              searchQuery={searchQuery}
            />

            {students.length > 0 && (
              <SummaryFooter
                attendanceMap={attendanceMap}
                onSubmit={handleSubmit}
                onReset={handleResetAll}
                isPending={markMutation.isPending}
                studentCount={students.length}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
