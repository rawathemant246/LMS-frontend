"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useSectionAssignments, useSubmitAssignment } from "@/hooks/use-assignments";
import {
  FileEdit,
  ChevronLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  ClipboardList,
  CalendarDays,
  BookOpen,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: string) {
  const s = status.toLowerCase();
  if (s === "submitted" || s === "turned_in")
    return { label: "Submitted", color: "bg-blue-100 text-blue-700 hover:bg-blue-100", icon: CheckCircle2 };
  if (s === "graded" || s === "evaluated")
    return { label: "Graded", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100", icon: Award };
  if (s === "late" || s === "overdue")
    return { label: "Late", color: "bg-red-100 text-red-700 hover:bg-red-100", icon: AlertCircle };
  // pending / published / active
  return { label: "Pending", color: "bg-amber-100 text-amber-700 hover:bg-amber-100", icon: Clock };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

const slideIn: Variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// Page Banner
// ---------------------------------------------------------------------------

function PageBanner({ count, isLoading }: { count: number; isLoading: boolean }) {
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
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Assignments</h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              {count} assignment{count !== 1 ? "s" : ""} in your section
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Stay on track</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Assignment Detail + Submit
// ---------------------------------------------------------------------------

function AssignmentDetail({
  assignment,
  studentId,
  onBack,
}: {
  assignment: any;
  studentId: string;
  onBack: () => void;
}) {
  const [response, setResponse] = useState("");
  const submitMutation = useSubmitAssignment();

  const assignmentId = assignment.assignment_id ?? assignment.id;
  const status = (assignment.status ?? "pending").toLowerCase();
  const statusConf = getStatusConfig(status);
  const isSubmittable = status === "pending" || status === "published" || status === "active";
  const marks = assignment.marks ?? assignment.score ?? assignment.grade ?? null;
  const totalMarks = assignment.total_marks ?? assignment.max_marks ?? null;

  const handleSubmit = () => {
    if (!response.trim()) return;
    submitMutation.mutate(
      { assignmentId, data: { student_id: studentId, content: response.trim() } },
      { onSuccess: () => { setResponse(""); onBack(); } },
    );
  };

  return (
    <motion.div
      key="detail"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideIn}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors duration-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to assignments
      </button>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {assignment.title ?? assignment.name ?? "Assignment"}
              </h2>
              <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                {assignment.subject_name && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{assignment.subject_name ?? assignment.subjectName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Due: {formatDate(assignment.due_date ?? assignment.dueDate)}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={`border-transparent ${statusConf.color} flex-shrink-0`}>
              <statusConf.icon className="h-3 w-3 mr-1" />
              {statusConf.label}
            </Badge>
          </div>

          {/* Description */}
          {(assignment.description || assignment.instructions) && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
              <div className="rounded-xl border border-border/40 bg-gray-50/50 p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {assignment.description ?? assignment.instructions}
              </div>
            </div>
          )}

          {/* Marks if graded */}
          {marks !== null && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Marks
                </p>
                <p className="text-2xl font-extrabold text-foreground">
                  {marks}
                  {totalMarks ? <span className="text-base font-normal text-muted-foreground"> / {totalMarks}</span> : ""}
                </p>
              </div>
            </div>
          )}

          {/* Submit form */}
          {isSubmittable && (
            <div className="border-t border-border/40 pt-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Send className="h-4 w-4 text-brand-primary" />
                Submit Your Response
              </h3>
              <Textarea
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="mb-4 min-h-[120px]"
              />
              <Button
                onClick={handleSubmit}
                disabled={!response.trim() || submitMutation.isPending}
                className="bg-gradient-to-r from-brand-primary to-violet-600 hover:from-brand-primary/90 hover:to-violet-600/90 text-white shadow-sm"
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Assignment List
// ---------------------------------------------------------------------------

function AssignmentList({
  assignments,
  onSelect,
}: {
  assignments: any[];
  onSelect: (assignment: any) => void;
}) {
  if (assignments.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileEdit className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground mb-1">No assignments yet</p>
          <p className="text-xs text-muted-foreground/60">
            Assignments from your teachers will appear here
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
      className="space-y-3"
    >
      {assignments.map((assignment: any) => {
        const assignmentId = assignment.assignment_id ?? assignment.id;
        const status = (assignment.status ?? "pending").toLowerCase();
        const statusConf = getStatusConfig(status);
        const marks = assignment.marks ?? assignment.score ?? assignment.grade ?? null;
        const totalMarks = assignment.total_marks ?? assignment.max_marks ?? null;

        return (
          <motion.div
            key={assignmentId}
            variants={fadeSlideUp}
            whileHover={{ y: -2, scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <Card
              className="relative overflow-hidden border border-border/60 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => onSelect(assignment)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Subject icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-sm flex-shrink-0">
                  <FileEdit className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-brand-primary transition-colors duration-200">
                    {assignment.title ?? assignment.name ?? "Assignment"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {(assignment.subject_name ?? assignment.subjectName) && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {assignment.subject_name ?? assignment.subjectName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Due: {formatDate(assignment.due_date ?? assignment.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Marks (if graded) */}
                {marks !== null && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-extrabold text-foreground">
                      {marks}
                      {totalMarks ? <span className="text-xs font-normal text-muted-foreground">/{totalMarks}</span> : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">marks</p>
                  </div>
                )}

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className={`border-transparent ${statusConf.color} flex-shrink-0`}
                >
                  <statusConf.icon className="h-3 w-3 mr-1" />
                  {statusConf.label}
                </Badge>
              </CardContent>

              {/* Hover accent bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentAssignmentsPage() {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id ?? "";
  const sectionId = student?.section_id;

  const { data: assignmentsRaw, isLoading: assignmentsLoading } = useSectionAssignments(sectionId);
  const assignments = useMemo(() => extractArray(assignmentsRaw), [assignmentsRaw]);

  const isLoading = studentLoading || assignmentsLoading;

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {selectedAssignment ? (
          <AssignmentDetail
            key="detail"
            assignment={selectedAssignment}
            studentId={studentId}
            onBack={() => setSelectedAssignment(null)}
          />
        ) : (
          <motion.div
            key="list"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideIn}
          >
            <PageBanner count={assignments.length} isLoading={isLoading} />

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <AssignmentList
                assignments={assignments}
                onSelect={setSelectedAssignment}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
