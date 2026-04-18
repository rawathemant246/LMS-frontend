"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useAcademicYears, useClasses, useSubjects } from "@/hooks/use-academic";
import { useChapters } from "@/hooks/use-content";

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

// ── Animation variants ───────────────────────────────────────────────────────

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const tabFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

// ── Status badge colors ──────────────────────────────────────────────────────

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

// ── Question type / difficulty badges ────────────────────────────────────────

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

// ── Create Exam Dialog ───────────────────────────────────────────────────────

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
    setForm({
      name: "",
      exam_type: "",
      subject_id: "",
      total_marks: "",
      duration_minutes: "",
      scheduled_date: "",
    });

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
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, exam_type: val ?? "" }))
                }
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
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, subject_id: val ?? "" }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_marks: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration_minutes: e.target.value }))
                }
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
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduled_date: e.target.value }))
              }
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

// ── TAB 1 — Exams ────────────────────────────────────────────────────────────

function ExamsTab() {
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: examsData, isLoading: examsLoading } = useExams();
  const exams = extractArray(examsData);

  const { data: yearsData } = useAcademicYears();
  const years = extractArray(yearsData);
  const currentYearId = years.length > 0 ? String(years[0].academic_year_id ?? years[0].id ?? "") : undefined;

  const { data: classesData } = useClasses(currentYearId);
  const classes = extractArray(classesData);

  const { data: subjectsData } = useSubjects();
  const subjects = extractArray(subjectsData);

  const publishMutation = usePublishExam();
  const autoGenMutation = useAutoGenerate();

  const filtered = useMemo(() => {
    return exams.filter((exam: any) => {
      if (filterClass && String(exam.class_id ?? "") !== filterClass) return false;
      if (filterSubject && String(exam.subject_id ?? "") !== filterSubject) return false;
      if (filterStatus && (exam.status ?? "").toLowerCase() !== filterStatus) return false;
      return true;
    });
  }, [exams, filterClass, filterSubject, filterStatus]);

  if (examsLoading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-9 w-40" />
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={filterClass} onValueChange={(val) => setFilterClass(val === "all" ? "" : val ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls: any) => (
              <SelectItem
                key={cls.class_id ?? cls.id}
                value={String(cls.class_id ?? cls.id)}
              >
                {cls.class_name ?? cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSubject} onValueChange={(val) => setFilterSubject(val === "all" ? "" : val ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
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

        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val === "all" ? "" : val ?? "")}>
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
      </div>

      {/* Exam card grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No exams found</p>
          <p className="text-xs text-gray-400 mt-1">
            Create your first exam using the button above
          </p>
        </div>
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
              subjects.find(
                (s: any) =>
                  String(s.subject_id ?? s.id) === String(exam.subject_id)
              )?.subject_name ??
              subjects.find(
                (s: any) =>
                  String(s.subject_id ?? s.id) === String(exam.subject_id)
              )?.name ??
              "";
            const className =
              exam.class_name ??
              exam.class?.name ??
              classes.find(
                (c: any) =>
                  String(c.class_id ?? c.id) === String(exam.class_id)
              )?.class_name ??
              classes.find(
                (c: any) =>
                  String(c.class_id ?? c.id) === String(exam.class_id)
              )?.name ??
              "";

            return (
              <motion.div key={examId} variants={staggerItem}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    {/* Top: name + status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {exam.name ?? exam.title ?? "Untitled Exam"}
                      </h3>
                      <StatusBadge status={status} />
                    </div>

                    {/* Middle: details */}
                    <div className="space-y-1.5 mb-4">
                      {(className || subjectName) && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {[className, subjectName].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {exam.total_marks ?? "?"} marks
                        {exam.duration_minutes
                          ? ` \u00b7 ${Math.floor(Number(exam.duration_minutes) / 60)}h ${Number(exam.duration_minutes) % 60 > 0 ? `${Number(exam.duration_minutes) % 60}m` : ""}`
                          : ""}
                      </p>
                      {exam.scheduled_date && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {new Date(exam.scheduled_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Bottom: action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDraft && (
                        <>
                          <Button variant="outline" size="sm">
                            <PenLine className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              autoGenMutation.mutate({ examId, data: {} })
                            }
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
                          <Button variant="outline" size="sm">
                            <PenLine className="h-3.5 w-3.5 mr-1" />
                            Marks Entry
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

// ── TAB 2 — Question Bank ────────────────────────────────────────────────────

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
    mutation.mutate(payload, {
      onSuccess: () => { setOpen(false); reset(); },
    });
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
              onChange={(e) =>
                setForm((f) => ({ ...f, question_text: e.target.value }))
              }
              placeholder="Enter the question..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Question Type</Label>
              <Select
                value={form.question_type}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, question_type: val ?? "" }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, marks: e.target.value }))
                }
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
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, difficulty: val ?? "" }))
                }
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
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, chapter_id: val ?? "" }))
                }
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, correct_answer: e.target.value }))
                    }
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
              onChange={(e) =>
                setForm((f) => ({ ...f, explanation: e.target.value }))
              }
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

function QuestionBankTab() {
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterChapterId, setFilterChapterId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  const { data: subjectsData } = useSubjects();
  const subjects = extractArray(subjectsData);

  const { data: chaptersData } = useChapters(filterSubjectId || undefined);
  const chapters = extractArray(chaptersData);

  const { data: questionsData, isLoading: questionsLoading } = useQuestions({
    subject_id: filterSubjectId || undefined,
    chapter_id: filterChapterId || undefined,
    question_type: filterType || undefined,
    difficulty: filterDifficulty || undefined,
  });
  const questions = extractArray(questionsData);

  const verifyMutation = useVerifyQuestion();

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select
          value={filterSubjectId}
          onValueChange={(val) => {
            setFilterSubjectId(val === "all" ? "" : val ?? "");
            setFilterChapterId("");
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
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
          onValueChange={(val) => setFilterChapterId(val === "all" ? "" : val ?? "")}
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

        <Select value={filterType} onValueChange={(val) => setFilterType(val === "all" ? "" : val ?? "")}>
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
            <SelectItem value="match_following">Match Following</SelectItem>
            <SelectItem value="assertion_reason">Assertion &amp; Reason</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterDifficulty}
          onValueChange={(val) => setFilterDifficulty(val === "all" ? "" : val ?? "")}
        >
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
      <div className="rounded-xl border bg-white">
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
                  const chapterName =
                    q.chapter_name ?? q.chapter?.name ?? q.chapter?.title ?? "";

                  return (
                    <motion.tr
                      key={qId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b last:border-b-0"
                    >
                      <TableCell className="text-sm text-gray-800 max-w-xs">
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
                            DIFFICULTY_COLORS[difficulty] ??
                            "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {q.marks ?? "?"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {chapterName || "\u2014"}
                      </TableCell>
                      <TableCell>
                        {isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
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

// ── TAB 3 — Results ──────────────────────────────────────────────────────────

function ResultsTab() {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [editedMarks, setEditedMarks] = useState<Record<string, string>>({});

  const { data: examsData } = useExams();
  const exams = extractArray(examsData);

  const { data: resultsData, isLoading: resultsLoading } = useExamResults(
    selectedExamId || undefined
  );
  const results = extractArray(resultsData);

  const bulkMarksMutation = useBulkMarks();
  const declareResultsMutation = useDeclareResults();

  const selectedExam = useMemo(
    () =>
      exams.find(
        (e: any) =>
          String(e.exam_id ?? e.id) === selectedExamId
      ),
    [exams, selectedExamId]
  );

  const maxMarks = Number(selectedExam?.total_marks ?? 100);

  // Summary stats
  const stats = useMemo(() => {
    if (results.length === 0)
      return { total: 0, avg: 0, highest: 0, lowest: 0, passPercent: 0 };

    const marks = results.map(
      (r: any) => Number(r.total_marks ?? r.marks ?? r.total ?? 0)
    );
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm font-medium">Exam</Label>
          <Select
            value={selectedExamId}
            onValueChange={(val) => {
              setSelectedExamId(val ?? "");
              setEditedMarks({});
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam: any) => (
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
              disabled={
                bulkMarksMutation.isPending ||
                Object.keys(editedMarks).length === 0
              }
            >
              {bulkMarksMutation.isPending ? "Saving..." : "Save Marks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => declareResultsMutation.mutate(selectedExamId)}
              disabled={declareResultsMutation.isPending}
            >
              {declareResultsMutation.isPending
                ? "Declaring..."
                : "Declare Results"}
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedExamId ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            Select an exam to view results
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Choose an exam from the dropdown above to manage marks and results
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stats.total}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stats.avg.toFixed(1)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Highest</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stats.highest}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lowest</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stats.lowest}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pass %</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stats.passPercent.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marks entry table */}
          <div className="rounded-xl border bg-white">
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
                    const studentId = String(
                      r.student_id ?? r.student?.id ?? idx
                    );
                    const currentMarks =
                      editedMarks[studentId] ??
                      String(r.total_marks ?? r.marks ?? r.total ?? "");
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
                      <TableRow key={studentId}>
                        <TableCell className="text-gray-500 text-sm tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {r.roll_number ?? r.roll_no ?? r.student?.roll_number ?? "\u2014"}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {r.student_name ??
                            r.student?.name ??
                            r.student?.full_name ??
                            (`${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.trim() ||
                            "Student")}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={currentMarks}
                            onChange={(e) =>
                              handleMarksChange(studentId, e.target.value)
                            }
                            className="w-20 h-8 text-sm tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {numMarks}/{maxMarks}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-transparent ${gradeColor} hover:${gradeColor}`}
                          >
                            {grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const { data: subjectsData } = useSubjects();
  const subjects = extractArray(subjectsData);

  return (
    <div>
      <PageHeader
        title="Exams"
        description="Manage exams, question bank, and results"
      >
        <CreateExamDialog subjects={subjects} />
      </PageHeader>

      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="question-bank">Question Bank</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="exams">
            <motion.div
              key="exams-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ExamsTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="question-bank">
            <motion.div
              key="qb-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <QuestionBankTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="results">
            <motion.div
              key="results-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ResultsTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
