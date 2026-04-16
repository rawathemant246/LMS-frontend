"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTeacherProfile,
  useTeacherAssignments,
} from "@/hooks/use-teacher-context";
import { useSectionStudents } from "@/hooks/use-attendance";
import {
  BookOpen,
  Users,
  ChevronDown,
  ClipboardCheck,
  BarChart3,
  FileEdit,
  GraduationCap,
  Sparkles,
  X,
  Hash,
  TrendingUp,
  Inbox,
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

// Gradient accent colors per subject — cycles through a curated palette
const SUBJECT_GRADIENTS = [
  { from: "from-indigo-500", to: "to-violet-500", bg: "bg-indigo-500/10", text: "text-indigo-600", ring: "ring-indigo-500/20", glow: "bg-indigo-400" },
  { from: "from-emerald-500", to: "to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/20", glow: "bg-emerald-400" },
  { from: "from-rose-500", to: "to-pink-500", bg: "bg-rose-500/10", text: "text-rose-600", ring: "ring-rose-500/20", glow: "bg-rose-400" },
  { from: "from-amber-500", to: "to-orange-500", bg: "bg-amber-500/10", text: "text-amber-600", ring: "ring-amber-500/20", glow: "bg-amber-400" },
  { from: "from-sky-500", to: "to-cyan-500", bg: "bg-sky-500/10", text: "text-sky-600", ring: "ring-sky-500/20", glow: "bg-sky-400" },
  { from: "from-purple-500", to: "to-fuchsia-500", bg: "bg-purple-500/10", text: "text-purple-600", ring: "ring-purple-500/20", glow: "bg-purple-400" },
  { from: "from-lime-500", to: "to-green-500", bg: "bg-lime-500/10", text: "text-lime-600", ring: "ring-lime-500/20", glow: "bg-lime-400" },
  { from: "from-blue-500", to: "to-indigo-500", bg: "bg-blue-500/10", text: "text-blue-600", ring: "ring-blue-500/20", glow: "bg-blue-400" },
];

function getSubjectGradient(index: number) {
  return SUBJECT_GRADIENTS[index % SUBJECT_GRADIENTS.length];
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const expandDetail: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const fadeIn: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassAssignment {
  id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  class_name: string;
  section_name: string;
  subject_name: string;
  student_count?: number;
  average_mastery?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader({ count, isLoading }: { count: number; isLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      {/* Decorative mesh overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 45%, white 1px, transparent 1px), radial-gradient(circle at 75% 25%, white 1px, transparent 1px), radial-gradient(circle at 50% 75%, white 1px, transparent 1px)",
          backgroundSize: "55px 55px, 75px 75px, 65px 65px",
        }}
      />
      {/* Floating orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                My Classes
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-36 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              {count} class{count !== 1 ? "es" : ""} assigned to you
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function MasteryBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 80
      ? "bg-emerald-500"
      : clamped >= 60
      ? "bg-amber-500"
      : clamped >= 40
      ? "bg-orange-500"
      : "bg-rose-500";

  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`w-full ${height} rounded-full bg-gray-100 overflow-hidden`}>
      <motion.div
        className={`${height} rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StudentDetailPanel({
  sectionId,
  assignment,
  gradientTheme,
}: {
  sectionId: string;
  assignment: ClassAssignment;
  gradientTheme: (typeof SUBJECT_GRADIENTS)[number];
}) {
  const { data: studentsRaw, isLoading: studentsLoading } =
    useSectionStudents(sectionId);
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  const quickLinks = [
    {
      label: "Mark Attendance",
      href: "/teacher/attendance",
      icon: ClipboardCheck,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "View Gradebook",
      href: "/teacher/gradebook",
      icon: BarChart3,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Create Assignment",
      href: "/teacher/assignments",
      icon: FileEdit,
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <motion.div
      variants={expandDetail}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <div className="pt-4 pb-2 px-1">
        {/* Quick action links */}
        <div className="flex flex-wrap gap-2 mb-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${link.gradient} shadow-sm`}
                >
                  <link.icon className="h-3 w-3 text-white" />
                </div>
                <span className="group-hover:text-brand-primary transition-colors duration-200">
                  {link.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Student list */}
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Students
          </h4>
          {!studentsLoading && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {students.length}
            </Badge>
          )}
        </div>

        {studentsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              No students enrolled yet
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {students.map((student: any, idx: number) => {
              const name =
                `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
                student.name ||
                "Unnamed";
              const roll =
                student.roll_number ?? student.rollNumber ?? student.roll ?? "--";
              const mastery =
                student.average_mastery ?? student.mastery ?? null;
              const attendance =
                student.attendance_percentage ?? student.attendance ?? null;

              return (
                <motion.div
                  key={student.id ?? idx}
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-gray-50/60 px-3 py-2.5 hover:bg-white hover:border-border/80 hover:shadow-sm transition-all duration-200"
                >
                  {/* Avatar placeholder */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradientTheme.from} ${gradientTheme.to} text-white text-[10px] font-bold shadow-sm`}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & roll */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Hash className="h-2.5 w-2.5" />
                        {roll}
                      </span>
                    </div>
                  </div>

                  {/* Mastery */}
                  {mastery !== null && (
                    <div className="w-20 shrink-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-muted-foreground">Mastery</span>
                        <span className="text-[10px] font-semibold text-foreground">
                          {Math.round(mastery)}%
                        </span>
                      </div>
                      <MasteryBar value={mastery} size="sm" />
                    </div>
                  )}

                  {/* Attendance */}
                  {attendance !== null && (
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] text-muted-foreground block">Attend.</span>
                      <span
                        className={`text-xs font-bold ${
                          attendance >= 90
                            ? "text-emerald-600"
                            : attendance >= 75
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {Math.round(attendance)}%
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ClassCard({
  assignment,
  index,
  isExpanded,
  onToggle,
}: {
  assignment: ClassAssignment;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const theme = getSubjectGradient(index);
  const mastery = assignment.average_mastery ?? null;
  const studentCount = assignment.student_count ?? null;

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={isExpanded ? undefined : { y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      layout
    >
      <Card
        className={`relative overflow-hidden border transition-all duration-300 cursor-pointer group ${
          isExpanded
            ? `border-brand-primary/30 shadow-lg shadow-brand-primary/5 ring-1 ${theme.ring}`
            : "border-border/60 bg-white hover:shadow-xl hover:border-brand-primary/20"
        }`}
        onClick={onToggle}
      >
        {/* Gradient accent bar at top */}
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${theme.from} ${theme.to}`}
        />

        {/* Hover glow effect */}
        <div
          className={`pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${theme.glow}`}
        />

        <CardContent className="p-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Class + Section label */}
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {assignment.class_name || "Class"}{" "}
                <span className="text-muted-foreground font-medium">&mdash;</span>{" "}
                {assignment.section_name || "Section"}
              </h3>

              {/* Subject with accent */}
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${theme.from} ${theme.to} shadow-sm`}
                >
                  <GraduationCap className="h-3 w-3 text-white" />
                </div>
                <span className={`text-sm font-semibold ${theme.text}`}>
                  {assignment.subject_name || "Subject"}
                </span>
              </div>
            </div>

            {/* Expand/collapse chevron */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="mt-1"
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-4">
            {/* Student count badge */}
            {studentCount !== null && (
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 border border-border/40">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {studentCount}
                </span>
                <span className="text-[10px] text-muted-foreground">students</span>
              </div>
            )}

            {/* Average mastery progress */}
            {mastery !== null && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <TrendingUp className="h-2.5 w-2.5" />
                    Avg. Mastery
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {Math.round(mastery)}%
                  </span>
                </div>
                <MasteryBar value={mastery} />
              </div>
            )}
          </div>
        </CardContent>

        {/* Expanded detail panel */}
        <AnimatePresence>
          {isExpanded && (
            <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="border-t border-border/40 mt-1" />
              <StudentDetailPanel
                sectionId={assignment.section_id}
                assignment={assignment}
                gradientTheme={theme}
              />
            </div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
            <Inbox className="h-8 w-8 text-brand-primary/60" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">
            No classes assigned yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Once the school admin assigns you to class sections and subjects,
            they will appear here with student details and quick actions.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground/60">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Assignments sync automatically</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <Skeleton className="h-1.5 w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherClassesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data hooks
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const { data: assignmentsRaw, isLoading: assignmentsLoading } =
    useTeacherAssignments(teacherId);

  // Derive class-section-subject combos
  const assignments: ClassAssignment[] = useMemo(() => {
    const raw = extractArray(assignmentsRaw);
    return raw.map((a: any) => ({
      id: a.id ?? `${a.class_id}-${a.section_id}-${a.subject_id}`,
      class_id: a.class_id ?? "",
      section_id: a.section_id ?? "",
      subject_id: a.subject_id ?? "",
      class_name: a.class_name ?? a.className ?? "",
      section_name: a.section_name ?? a.sectionName ?? "",
      subject_name: a.subject_name ?? a.subjectName ?? "",
      student_count: a.student_count ?? a.studentCount ?? null,
      average_mastery: a.average_mastery ?? a.averageMastery ?? null,
    }));
  }, [assignmentsRaw]);

  const handleToggle = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [],
  );

  const isLoading = teacherLoading || assignmentsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <PageHeader count={assignments.length} isLoading={isLoading} />

      {/* Class cards grid */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {assignments.map((assignment, index) => (
            <ClassCard
              key={assignment.id}
              assignment={assignment}
              index={index}
              isExpanded={expandedId === assignment.id}
              onToggle={() => handleToggle(assignment.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
