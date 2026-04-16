"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileEdit,
  Send,
  CheckCircle,
  Clock,
  Users,
  ClipboardCheck,
  Inbox,
  CalendarDays,
  Award,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import {
  useTeacherProfile,
  useTeacherAssignments,
  useMyClasses,
} from "@/hooks/use-teacher-context";
import {
  useSectionAssignments,
  useCreateAssignment,
  usePublishAssignment,
  useSubmissions,
  useGradeSubmission,
} from "@/hooks/use-assignments";
import { extractArray } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const tabFade: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: "bg-amber-100 text-amber-700 hover:bg-amber-100", icon: FileEdit },
  published: { color: "bg-green-100 text-green-700 hover:bg-green-100", icon: CheckCircle },
  closed: { color: "bg-gray-100 text-gray-600 hover:bg-gray-100", icon: Clock },
};

function AssignmentStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cfg.color}`}>
      {status?.replace(/_/g, " ") || "Draft"}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page Header (gradient banner)
// ---------------------------------------------------------------------------

function PageBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-[#7C3AED] to-[#9333EA] p-6 md:p-8 text-white mb-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 45%, white 1px, transparent 1px), radial-gradient(circle at 75% 25%, white 1px, transparent 1px), radial-gradient(circle at 50% 75%, white 1px, transparent 1px)",
          backgroundSize: "55px 55px, 75px 75px, 65px 65px",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <FileEdit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-sm text-white/70 font-medium mt-0.5">
            Create, manage, and grade assignments
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Create Assignment Dialog
// ---------------------------------------------------------------------------

function CreateAssignmentDialog({
  sections,
  subjects,
}: {
  sections: any[];
  subjects: any[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    section_id: "",
    subject_id: "",
    due_date: "",
    max_marks: "",
  });

  const mutation = useCreateAssignment();

  const reset = () =>
    setForm({ title: "", description: "", section_id: "", subject_id: "", due_date: "", max_marks: "" });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        title: form.title,
        description: form.description || undefined,
        section_id: form.section_id,
        subject_id: form.subject_id,
        due_date: form.due_date || undefined,
        max_marks: Number(form.max_marks) || undefined,
      },
      { onSuccess: () => { setOpen(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Assignment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="assign-title">Title</Label>
            <Input
              id="assign-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Chapter 5 Homework"
              required
            />
          </div>
          <div>
            <Label htmlFor="assign-desc">Description</Label>
            <Textarea
              id="assign-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Instructions for students..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Section</Label>
              <Select
                value={form.section_id}
                onValueChange={(val) => setForm((f) => ({ ...f, section_id: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s: any) => (
                    <SelectItem
                      key={s.section_id ?? s.id}
                      value={String(s.section_id ?? s.id)}
                    >
                      {s.class_name ?? ""} {s.section_name ?? s.name ?? "Section"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(val) => setForm((f) => ({ ...f, subject_id: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem
                      key={s.subject_id ?? s.id}
                      value={String(s.subject_id ?? s.id)}
                    >
                      {s.subject_name ?? s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="assign-due">Due Date</Label>
              <Input
                id="assign-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="assign-marks">Max Marks</Label>
              <Input
                id="assign-marks"
                type="number"
                min="1"
                value={form.max_marks}
                onChange={(e) => setForm((f) => ({ ...f, max_marks: e.target.value }))}
                placeholder="e.g. 20"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !form.title || !form.section_id}
          >
            {mutation.isPending ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Grade Dialog
// ---------------------------------------------------------------------------

function GradeDialog({
  submission,
  maxMarks,
}: {
  submission: any;
  maxMarks: number;
}) {
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  const mutation = useGradeSubmission();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMarks("");
      setFeedback("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subId = String(submission.submission_id ?? submission.id ?? "");
    mutation.mutate(
      { id: subId, data: { marks: Number(marks), feedback: feedback || undefined } },
      { onSuccess: () => { setOpen(false); setMarks(""); setFeedback(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Award className="h-3.5 w-3.5 mr-1" />
        Grade
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Grade Submission -{" "}
            {submission.student_name ??
              `${submission.student?.first_name ?? ""} ${submission.student?.last_name ?? ""}`.trim() ??
              "Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="grade-marks">Marks (out of {maxMarks})</Label>
            <Input
              id="grade-marks"
              type="number"
              min="0"
              max={maxMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder={`0 - ${maxMarks}`}
              required
            />
          </div>
          <div>
            <Label htmlFor="grade-feedback">Feedback</Label>
            <Textarea
              id="grade-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback for the student..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Submit Grade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 -- My Assignments
// ---------------------------------------------------------------------------

function MyAssignmentsTab({
  sections,
  subjects,
}: {
  sections: any[];
  subjects: any[];
}) {
  const [filterSectionId, setFilterSectionId] = useState("");

  const { data: assignmentsRaw, isLoading } = useSectionAssignments(
    filterSectionId || (sections.length > 0 ? String(sections[0].section_id ?? sections[0].id ?? "") : undefined)
  );
  const assignments = useMemo(() => extractArray(assignmentsRaw), [assignmentsRaw]);
  const publishMutation = usePublishAssignment();

  const activeSectionId = filterSectionId || (sections.length > 0 ? String(sections[0].section_id ?? sections[0].id ?? "") : "");

  return (
    <div>
      {/* Filter + Action bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={activeSectionId} onValueChange={(val) => setFilterSectionId(val ?? "")}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s: any) => (
              <SelectItem
                key={s.section_id ?? s.id}
                value={String(s.section_id ?? s.id)}
              >
                {s.class_name ?? ""} {s.section_name ?? s.name ?? "Section"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <CreateAssignmentDialog sections={sections} subjects={subjects} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
                <Inbox className="h-8 w-8 text-violet-500/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">
                No assignments yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Create your first assignment for this section using the button above.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {assignments.map((assignment: any) => {
            const id = String(assignment.assignment_id ?? assignment.id ?? "");
            const status = (assignment.status ?? "draft").toLowerCase();
            const isDraft = status === "draft";
            const submitted = assignment.submission_count ?? assignment.submitted_count ?? 0;
            const total = assignment.total_students ?? assignment.student_count ?? "?";
            const dueDate = assignment.due_date ?? assignment.dueDate;
            const sectionName = assignment.section_name ?? assignment.sectionName ?? "";
            const subjectName = assignment.subject_name ?? assignment.subjectName ?? "";
            const maxMarks = assignment.max_marks ?? assignment.maxMarks ?? "?";

            return (
              <motion.div
                key={id}
                variants={fadeSlideUp}
                whileHover={{ y: -4, scale: 1.015 }}
              >
                <Card className="relative overflow-hidden border border-border/60 bg-white hover:shadow-xl transition-all duration-300 group">
                  {/* Accent bar */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${
                      isDraft
                        ? "from-amber-400 to-orange-400"
                        : status === "published"
                        ? "from-emerald-400 to-teal-400"
                        : "from-gray-300 to-gray-400"
                    }`}
                  />

                  {/* Hover glow */}
                  <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-violet-400" />

                  <CardContent className="p-5 pt-4">
                    {/* Title + Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                        {assignment.title ?? assignment.name ?? "Untitled"}
                      </h3>
                      <AssignmentStatusBadge status={status} />
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 mb-4">
                      {(sectionName || subjectName) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          {[sectionName, subjectName].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      {dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          Due: {new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          {submitted}/{total} submitted
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          {maxMarks} marks
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isDraft && (
                        <Button
                          size="sm"
                          onClick={() => publishMutation.mutate(id)}
                          disabled={publishMutation.isPending}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {publishMutation.isPending ? "Publishing..." : "Publish"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 -- Grade Submissions
// ---------------------------------------------------------------------------

function GradeSubmissionsTab({
  sections,
}: {
  sections: any[];
}) {
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const activeSectionId = selectedSectionId || (sections.length > 0 ? String(sections[0].section_id ?? sections[0].id ?? "") : "");

  const { data: assignmentsRaw } = useSectionAssignments(activeSectionId || undefined);
  const assignments = useMemo(() => extractArray(assignmentsRaw), [assignmentsRaw]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const selectedAssignment = useMemo(
    () => assignments.find((a: any) => String(a.assignment_id ?? a.id) === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const { data: submissionsRaw, isLoading: submissionsLoading } = useSubmissions(
    selectedAssignmentId || undefined
  );
  const submissions = useMemo(() => extractArray(submissionsRaw), [submissionsRaw]);

  const maxMarks = Number(selectedAssignment?.max_marks ?? selectedAssignment?.maxMarks ?? 100);

  return (
    <div>
      {/* Selectors */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={activeSectionId} onValueChange={(val) => { setSelectedSectionId(val ?? ""); setSelectedAssignmentId(""); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s: any) => (
              <SelectItem
                key={s.section_id ?? s.id}
                value={String(s.section_id ?? s.id)}
              >
                {s.class_name ?? ""} {s.section_name ?? s.name ?? "Section"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedAssignmentId}
          onValueChange={(val) => setSelectedAssignmentId(val ?? "")}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select assignment" />
          </SelectTrigger>
          <SelectContent>
            {assignments.map((a: any) => (
              <SelectItem
                key={a.assignment_id ?? a.id}
                value={String(a.assignment_id ?? a.id)}
              >
                {a.title ?? a.name ?? "Assignment"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {!selectedAssignmentId ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            Select an assignment to grade submissions
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Choose a section and assignment from the dropdowns above
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No submissions yet
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {submissions.map((sub: any, idx: number) => {
                    const subId = String(sub.submission_id ?? sub.id ?? idx);
                    const studentName =
                      sub.student_name ??
                      sub.student?.name ??
                      (`${sub.student?.first_name ?? ""} ${sub.student?.last_name ?? ""}`.trim() || "Student");
                    const submittedAt = sub.submitted_at ?? sub.created_at;
                    const status = (sub.status ?? "submitted").toLowerCase();
                    const isLate = sub.is_late ?? sub.late ?? false;
                    const gradedMarks = sub.marks ?? sub.grade ?? sub.score;
                    const isGraded = status === "graded" || gradedMarks !== undefined;

                    return (
                      <motion.tr
                        key={subId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`border-b last:border-b-0 ${isLate ? "bg-amber-50/50" : ""}`}
                      >
                        <TableCell className="text-gray-500 text-sm tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            {studentName}
                            {isLate && (
                              <Badge variant="outline" className="border-transparent bg-amber-100 text-amber-700 text-[10px] hover:bg-amber-100">
                                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                Late
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {submittedAt
                            ? new Date(submittedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-transparent capitalize ${
                              isGraded
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {isGraded ? "Graded" : "Submitted"}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {isGraded ? `${gradedMarks}/${maxMarks}` : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <GradeDialog submission={sub} maxMarks={maxMarks} />
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherAssignmentsPage() {
  const { data: teacher } = useTeacherProfile();
  const teacherId = teacher?.id;
  const myClasses = useMyClasses(teacherId);

  const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
  const teacherSubjects = useMemo(() => {
    const raw = extractArray(assignmentsRaw);
    const seen = new Set<string>();
    return raw.filter((a: any) => {
      if (seen.has(a.subject_id)) return false;
      seen.add(a.subject_id);
      return true;
    });
  }, [assignmentsRaw]);

  // Derive unique sections with class+section info
  const sections = useMemo(() => {
    return myClasses.map((c: any) => ({
      section_id: c.section_id ?? c.id,
      class_name: c.class_name ?? c.className ?? "",
      section_name: c.section_name ?? c.sectionName ?? "",
    }));
  }, [myClasses]);

  const subjects = useMemo(() => {
    return teacherSubjects.map((s: any) => ({
      subject_id: s.subject_id ?? s.id,
      subject_name: s.subject_name ?? s.subjectName ?? s.name ?? "",
    }));
  }, [teacherSubjects]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner />

      <Tabs defaultValue="my-assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="grade-submissions">Grade Submissions</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="my-assignments">
            <motion.div key="assignments-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <MyAssignmentsTab sections={sections} subjects={subjects} />
            </motion.div>
          </TabsContent>

          <TabsContent value="grade-submissions">
            <motion.div key="grading-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <GradeSubmissionsTab sections={sections} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
