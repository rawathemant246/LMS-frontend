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
  CheckCircle,
  FileText,
  ClipboardList,
  Sparkles,
  Send,
  Eye,
  BarChart3,
  PenLine,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Save,
  GraduationCap,
} from "lucide-react";
import { extractArray } from "@/lib/utils";
import {
  useTeacherProfile,
  useMySubjects,
  useTeacherAssignments,
} from "@/hooks/use-teacher-context";
import {
  useExams,
  useCreateExam,
  usePublishExam,
  useAutoGenerate,
  useExamResults,
  useBulkMarks,
  useDeclareResults,
  useQuestions,
  useCreateQuestion,
  useVerifyQuestion,
} from "@/hooks/use-exams";
import { useChapters } from "@/hooks/use-content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const staggerItem: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.97 },
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
// Status badge config (matches admin exams)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  published: "bg-green-100 text-green-700 hover:bg-green-100",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  results_declared: "bg-purple-100 text-purple-700 hover:bg-purple-100",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_COLORS[status?.toLowerCase()] ??
    "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cls}`}>
      {status?.replace(/_/g, " ") || "Unknown"}
    </Badge>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "MCQ",
  short_answer: "Short",
  long_answer: "Long",
  true_false: "T/F",
  fill_blank: "Fill",
  match_following: "Match",
  assertion_reason: "A&R",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 hover:bg-green-100",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  hard: "bg-red-100 text-red-700 hover:bg-red-100",
};

// ---------------------------------------------------------------------------
// Page Header (gradient banner)
// ---------------------------------------------------------------------------

function PageBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-[#4F46E5] to-[#7C3AED] p-6 md:p-8 text-white mb-8"
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
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <ClipboardList className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Exams</h1>
          <p className="text-sm text-white/70 font-medium mt-0.5">
            Manage exams, question bank, and enter marks
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Create Exam Dialog
// ---------------------------------------------------------------------------

function CreateExamDialog({ subjects }: { subjects: any[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    exam_type: "",
    subject_id: "",
    total_marks: "",
    duration_minutes: "",
    scheduled_date: "",
  });

  const mutation = useCreateExam();

  const reset = () =>
    setForm({ name: "", exam_type: "", subject_id: "", total_marks: "", duration_minutes: "", scheduled_date: "" });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        name: form.name,
        exam_type: form.exam_type,
        subject_id: form.subject_id,
        total_marks: Number(form.total_marks),
        duration_minutes: Number(form.duration_minutes),
        scheduled_date: form.scheduled_date || undefined,
      },
      { onSuccess: () => { setOpen(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Exam
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="exam-name">Exam Name</Label>
            <Input
              id="exam-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mid-Term Mathematics"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Exam Type</Label>
              <Select
                value={form.exam_type}
                onValueChange={(val) => setForm((f) => ({ ...f, exam_type: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit_test">Unit Test</SelectItem>
                  <SelectItem value="mid_term">Mid Term</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
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
              <Label htmlFor="exam-marks">Total Marks</Label>
              <Input
                id="exam-marks"
                type="number"
                min="1"
                value={form.total_marks}
                onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))}
                placeholder="e.g. 80"
                required
              />
            </div>
            <div>
              <Label htmlFor="exam-duration">Duration (minutes)</Label>
              <Input
                id="exam-duration"
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                placeholder="e.g. 180"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="exam-date">Scheduled Date</Label>
            <Input
              id="exam-date"
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !form.exam_type || !form.subject_id}
          >
            {mutation.isPending ? "Creating..." : "Create Exam"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 -- My Exams
// ---------------------------------------------------------------------------

function MyExamsTab({ subjectIds, subjects }: { subjectIds: string[]; subjects: any[] }) {
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: examsData, isLoading: examsLoading } = useExams();
  const allExams = extractArray(examsData);

  const publishMutation = usePublishExam();
  const autoGenMutation = useAutoGenerate();

  // Filter to only teacher's subjects
  const filtered = useMemo(() => {
    return allExams.filter((exam: any) => {
      const examSubjectId = String(exam.subject_id ?? "");
      if (subjectIds.length > 0 && !subjectIds.includes(examSubjectId)) return false;
      if (filterSubject && filterSubject !== "all" && examSubjectId !== filterSubject) return false;
      if (filterStatus && filterStatus !== "all" && (exam.status ?? "").toLowerCase() !== filterStatus) return false;
      return true;
    });
  }, [allExams, subjectIds, filterSubject, filterStatus]);

  if (examsLoading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={filterSubject} onValueChange={(val) => setFilterSubject(val ?? "")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All My Subjects</SelectItem>
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

        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="results_declared">Results Declared</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <CreateExamDialog subjects={subjects} />
        </div>
      </div>

      {/* Exam card grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <FileText className="h-8 w-8 text-blue-500/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">No exams found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create your first exam using the button above
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filtered.map((exam: any) => {
            const examId = String(exam.exam_id ?? exam.id ?? "");
            const status = (exam.status ?? "draft").toLowerCase();
            const isDraft = status === "draft";
            const subjectName =
              exam.subject_name ??
              exam.subject?.name ??
              subjects.find((s: any) => String(s.subject_id ?? s.id) === String(exam.subject_id))?.subject_name ??
              subjects.find((s: any) => String(s.subject_id ?? s.id) === String(exam.subject_id))?.name ??
              "";

            return (
              <motion.div key={examId} variants={staggerItem} whileHover={{ y: -3, scale: 1.01 }}>
                <Card className="relative overflow-hidden border border-border/60 bg-white hover:shadow-xl transition-all duration-300 group">
                  {/* Accent bar */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${
                      isDraft
                        ? "from-amber-400 to-orange-400"
                        : status === "published"
                        ? "from-emerald-400 to-teal-400"
                        : status === "results_declared"
                        ? "from-purple-400 to-fuchsia-400"
                        : "from-gray-300 to-gray-400"
                    }`}
                  />

                  {/* Hover glow */}
                  <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-indigo-400" />

                  <CardContent className="p-5 pt-4">
                    {/* Top: name + status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">
                        {exam.name ?? exam.title ?? "Untitled Exam"}
                      </h3>
                      <StatusBadge status={status} />
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 mb-4">
                      {subjectName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          {subjectName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        {exam.total_marks ?? "?"} marks
                        {exam.duration_minutes
                          ? ` \u00b7 ${Math.floor(Number(exam.duration_minutes) / 60)}h ${Number(exam.duration_minutes) % 60 > 0 ? `${Number(exam.duration_minutes) % 60}m` : ""}`
                          : ""}
                      </p>
                      {exam.scheduled_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          {new Date(exam.scheduled_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDraft && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => autoGenMutation.mutate({ examId, data: {} })}
                            disabled={autoGenMutation.isPending}
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            {autoGenMutation.isPending ? "Generating..." : "Auto-Generate"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => publishMutation.mutate(examId)}
                            disabled={publishMutation.isPending}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            {publishMutation.isPending ? "Publishing..." : "Publish"}
                          </Button>
                        </>
                      )}
                      {!isDraft && (
                        <>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Paper
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-3.5 w-3.5 mr-1" />
                            Results
                          </Button>
                        </>
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
// TAB 2 -- Question Bank
// ---------------------------------------------------------------------------

function AddQuestionDialog({ subjects }: { subjects: any[] }) {
  const [open, setOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [form, setForm] = useState({
    question_text: "",
    question_type: "",
    marks: "",
    difficulty: "",
    chapter_id: "",
    explanation: "",
    options: ["", "", "", ""],
    correct_answer: "0",
  });

  const { data: chaptersData } = useChapters(selectedSubjectId || undefined);
  const chapters = extractArray(chaptersData);
  const mutation = useCreateQuestion();

  const reset = () => {
    setSelectedSubjectId("");
    setForm({
      question_text: "",
      question_type: "",
      marks: "",
      difficulty: "",
      chapter_id: "",
      explanation: "",
      options: ["", "", "", ""],
      correct_answer: "0",
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      question_text: form.question_text,
      question_type: form.question_type,
      marks: Number(form.marks),
      difficulty: form.difficulty,
      chapter_id: form.chapter_id,
      explanation: form.explanation || undefined,
    };
    if (form.question_type === "mcq") {
      payload.options = form.options;
      payload.correct_answer = Number(form.correct_answer);
    }
    mutation.mutate(payload, { onSuccess: () => { setOpen(false); reset(); } });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="q-text">Question Text</Label>
            <Textarea
              id="q-text"
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              placeholder="Enter the question..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Question Type</Label>
              <Select
                value={form.question_type}
                onValueChange={(val) => setForm((f) => ({ ...f, question_type: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="long_answer">Long Answer</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                  <SelectItem value="match_following">Match the Following</SelectItem>
                  <SelectItem value="assertion_reason">Assertion &amp; Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="q-marks">Marks</Label>
              <Input
                id="q-marks"
                type="number"
                min="1"
                value={form.marks}
                onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                placeholder="e.g. 2"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(val) => setForm((f) => ({ ...f, difficulty: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(val) => {
                  setSelectedSubjectId(val ?? "");
                  setForm((f) => ({ ...f, chapter_id: "" }));
                }}
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
          {selectedSubjectId && (
            <div>
              <Label>Chapter</Label>
              <Select
                value={form.chapter_id}
                onValueChange={(val) => setForm((f) => ({ ...f, chapter_id: val ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch: any) => (
                    <SelectItem
                      key={ch.chapter_id ?? ch.id}
                      value={String(ch.chapter_id ?? ch.id)}
                    >
                      {ch.chapter_name ?? ch.title ?? ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MCQ options */}
          {form.question_type === "mcq" && (
            <div className="space-y-3 rounded-lg border p-3 bg-gray-50/50">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                MCQ Options
              </Label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    value={String(idx)}
                    checked={form.correct_answer === String(idx)}
                    onChange={(e) => setForm((f) => ({ ...f, correct_answer: e.target.value }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      newOpts[idx] = e.target.value;
                      setForm((f) => ({ ...f, options: newOpts }));
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">
                Select the radio button for the correct answer
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="q-explanation">Explanation (optional)</Label>
            <Textarea
              id="q-explanation"
              value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              placeholder="Explain the answer..."
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !form.question_type || !form.difficulty}
          >
            {mutation.isPending ? "Adding..." : "Add Question"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuestionBankTab({ subjectIds, subjects }: { subjectIds: string[]; subjects: any[] }) {
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  const { data: chaptersData } = useChapters(filterSubjectId || undefined);
  const chapters = extractArray(chaptersData);

  // Only query teacher's subjects
  const effectiveSubjectId = filterSubjectId || (subjectIds.length === 1 ? subjectIds[0] : undefined);

  const { data: questionsData, isLoading: questionsLoading } = useQuestions({
    subject_id: effectiveSubjectId || undefined,
    chapter_id: filterChapterId || undefined,
    question_type: filterType || undefined,
    difficulty: filterDifficulty || undefined,
  });
  const allQuestions = extractArray(questionsData);

  // Client-side filter by teacher's subjects if no specific filter set
  const questions = useMemo(() => {
    if (filterSubjectId) return allQuestions;
    if (subjectIds.length === 0) return allQuestions;
    return allQuestions.filter((q: any) => subjectIds.includes(String(q.subject_id ?? "")));
  }, [allQuestions, filterSubjectId, subjectIds]);

  const verifyMutation = useVerifyQuestion();

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select
          value={filterSubjectId}
          onValueChange={(val) => { setFilterSubjectId(val ?? ""); setFilterChapterId(""); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All My Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All My Subjects</SelectItem>
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

        <Select
          value={filterChapterId}
          onValueChange={(val) => setFilterChapterId(val ?? "")}
          disabled={!filterSubjectId}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chapters.map((ch: any) => (
              <SelectItem
                key={ch.chapter_id ?? ch.id}
                value={String(ch.chapter_id ?? ch.id)}
              >
                {ch.chapter_name ?? ch.title ?? ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(val) => setFilterType(val ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mcq">MCQ</SelectItem>
            <SelectItem value="short_answer">Short Answer</SelectItem>
            <SelectItem value="long_answer">Long Answer</SelectItem>
            <SelectItem value="true_false">True / False</SelectItem>
            <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDifficulty} onValueChange={(val) => setFilterDifficulty(val ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <AddQuestionDialog subjects={subjects} />
        </div>
      </div>

      {/* Questions table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Chapter</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questionsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-16" /></TableCell>
                </TableRow>
              ))
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No questions found
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {questions.map((q: any, idx: number) => {
                  const qId = String(q.question_id ?? q.id ?? idx);
                  const qType = q.question_type ?? "mcq";
                  const difficulty = (q.difficulty ?? "medium").toLowerCase();
                  const isVerified = q.is_verified ?? q.verified ?? false;
                  const chapterName = q.chapter_name ?? q.chapter?.name ?? q.chapter?.title ?? "";

                  return (
                    <motion.tr
                      key={qId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b last:border-b-0"
                    >
                      <TableCell className="text-sm text-foreground max-w-xs">
                        <p className="truncate">
                          {(q.question_text ?? q.text ?? "").length > 100
                            ? `${(q.question_text ?? q.text ?? "").slice(0, 100)}...`
                            : q.question_text ?? q.text ?? ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-transparent bg-blue-50 text-blue-700 hover:bg-blue-50"
                        >
                          {QUESTION_TYPE_LABELS[qType] ?? qType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-transparent capitalize ${
                            DIFFICULTY_COLORS[difficulty] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{q.marks ?? "?"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{chapterName || "\u2014"}</TableCell>
                      <TableCell>
                        {isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </TableCell>
                      <TableCell>
                        {!isVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyMutation.mutate(qId)}
                            disabled={verifyMutation.isPending}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 3 -- Enter Marks
// ---------------------------------------------------------------------------

function EnterMarksTab({ subjectIds, subjects }: { subjectIds: string[]; subjects: any[] }) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [editedMarks, setEditedMarks] = useState<Record<string, string>>({});

  const { data: examsData } = useExams();
  const allExams = extractArray(examsData);

  // Filter exams to teacher's subjects
  const teacherExams = useMemo(() => {
    if (subjectIds.length === 0) return allExams;
    return allExams.filter((e: any) => subjectIds.includes(String(e.subject_id ?? "")));
  }, [allExams, subjectIds]);

  const { data: resultsData, isLoading: resultsLoading } = useExamResults(selectedExamId || undefined);
  const results = extractArray(resultsData);

  const bulkMarksMutation = useBulkMarks();
  const declareResultsMutation = useDeclareResults();

  const selectedExam = useMemo(
    () => teacherExams.find((e: any) => String(e.exam_id ?? e.id) === selectedExamId),
    [teacherExams, selectedExamId]
  );

  const maxMarks = Number(selectedExam?.total_marks ?? 100);

  // Summary stats
  const stats = useMemo(() => {
    if (results.length === 0) return { total: 0, avg: 0, highest: 0, lowest: 0, passPercent: 0 };
    const marks = results.map((r: any) => Number(r.total_marks ?? r.marks ?? r.total ?? 0));
    const total = marks.length;
    const sum = marks.reduce((a: number, b: number) => a + b, 0);
    const avg = total > 0 ? sum / total : 0;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const passThreshold = maxMarks * 0.33;
    const passCount = marks.filter((m: number) => m >= passThreshold).length;
    const passPercent = total > 0 ? (passCount / total) * 100 : 0;
    return { total, avg, highest, lowest, passPercent };
  }, [results, maxMarks]);

  const handleMarksChange = (studentId: string, value: string) => {
    setEditedMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = () => {
    if (!selectedExamId) return;
    const entries = Object.entries(editedMarks).map(([studentId, marks]) => ({
      student_id: studentId,
      marks: Number(marks),
    }));
    if (entries.length === 0) return;
    bulkMarksMutation.mutate(
      { examId: selectedExamId, data: { marks: entries } },
      { onSuccess: () => setEditedMarks({}) }
    );
  };

  return (
    <div>
      {/* Exam selector */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm font-medium">Exam</Label>
          <Select
            value={selectedExamId}
            onValueChange={(val) => { setSelectedExamId(val ?? ""); setEditedMarks({}); }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>
            <SelectContent>
              {teacherExams.map((exam: any) => (
                <SelectItem
                  key={exam.exam_id ?? exam.id}
                  value={String(exam.exam_id ?? exam.id)}
                >
                  {exam.name ?? exam.title ?? "Exam"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedExamId && results.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleSaveMarks}
              disabled={bulkMarksMutation.isPending || Object.keys(editedMarks).length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {bulkMarksMutation.isPending ? "Saving..." : "Save Marks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => declareResultsMutation.mutate(selectedExamId)}
              disabled={declareResultsMutation.isPending}
            >
              {declareResultsMutation.isPending ? "Declaring..." : "Declare Results"}
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedExamId ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select an exam to enter marks</p>
          <p className="text-xs text-gray-400 mt-1">Choose one of your exams from the dropdown above</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4"
            >
              {[
                { label: "Students", value: stats.total, icon: Users, bg: "bg-blue-100", iconColor: "text-blue-600" },
                { label: "Average", value: stats.avg.toFixed(1), icon: Clock, bg: "bg-amber-100", iconColor: "text-amber-600" },
                { label: "Highest", value: stats.highest, icon: TrendingUp, bg: "bg-green-100", iconColor: "text-green-600" },
                { label: "Lowest", value: stats.lowest, icon: TrendingDown, bg: "bg-red-100", iconColor: "text-red-600" },
                { label: "Pass %", value: `${stats.passPercent.toFixed(1)}%`, icon: Award, bg: "bg-purple-100", iconColor: "text-purple-600" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Marks entry table */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      No results available for this exam
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((r: any, idx: number) => {
                    const studentId = String(r.student_id ?? r.student?.id ?? idx);
                    const currentMarks =
                      editedMarks[studentId] ?? String(r.total_marks ?? r.marks ?? r.total ?? "");
                    const numMarks = Number(currentMarks) || 0;
                    const pct = maxMarks > 0 ? (numMarks / maxMarks) * 100 : 0;
                    let grade = "F";
                    if (pct >= 90) grade = "A+";
                    else if (pct >= 80) grade = "A";
                    else if (pct >= 70) grade = "B+";
                    else if (pct >= 60) grade = "B";
                    else if (pct >= 50) grade = "C";
                    else if (pct >= 33) grade = "D";

                    const gradeColor =
                      grade === "A+" || grade === "A"
                        ? "bg-green-100 text-green-700"
                        : grade === "B+" || grade === "B"
                        ? "bg-blue-100 text-blue-700"
                        : grade === "C" || grade === "D"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700";

                    return (
                      <motion.tr
                        key={studentId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b last:border-b-0"
                      >
                        <TableCell className="text-gray-500 text-sm tabular-nums">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {r.roll_number ?? r.roll_no ?? r.student?.roll_number ?? "\u2014"}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {r.student_name ??
                            r.student?.name ??
                            r.student?.full_name ??
                            (`${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.trim() || "Student")}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={currentMarks}
                            onChange={(e) => handleMarksChange(studentId, e.target.value)}
                            className="w-20 h-8 text-sm tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {numMarks}/{maxMarks}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-transparent ${gradeColor}`}
                          >
                            {grade}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherExamsPage() {
  const { data: teacher } = useTeacherProfile();
  const teacherId = teacher?.id;
  const mySubjects = useMySubjects(teacherId);

  const subjectIds = useMemo(
    () => mySubjects.map((s: any) => String(s.subject_id ?? s.id ?? "")),
    [mySubjects]
  );

  const subjects = useMemo(
    () =>
      mySubjects.map((s: any) => ({
        subject_id: s.subject_id ?? s.id,
        subject_name: s.subject_name ?? s.subjectName ?? s.name ?? "",
        name: s.subject_name ?? s.subjectName ?? s.name ?? "",
      })),
    [mySubjects]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner />

      <Tabs defaultValue="my-exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-exams">My Exams</TabsTrigger>
          <TabsTrigger value="question-bank">Question Bank</TabsTrigger>
          <TabsTrigger value="enter-marks">Enter Marks</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="my-exams">
            <motion.div key="exams-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <MyExamsTab subjectIds={subjectIds} subjects={subjects} />
            </motion.div>
          </TabsContent>

          <TabsContent value="question-bank">
            <motion.div key="qb-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <QuestionBankTab subjectIds={subjectIds} subjects={subjects} />
            </motion.div>
          </TabsContent>

          <TabsContent value="enter-marks">
            <motion.div key="marks-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <EnterMarksTab subjectIds={subjectIds} subjects={subjects} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
