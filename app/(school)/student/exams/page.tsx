"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useExams, useExamResults } from "@/hooks/use-exams";
import {
  useStartAttempt,
  useAttempt,
  useSaveAnswer,
  useSubmitAttempt,
  useRecordViolation,
} from "@/hooks/use-student-exam";
import { toast } from "sonner";
import {
  ClipboardList,
  Sparkles,
  Clock,
  CalendarDays,
  BookOpen,
  Award,
  Play,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Timer,
  CheckCircle2,
  XCircle,
  Send,
  Trash2,
  Maximize,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "true_false"
  | "fill_blank"
  | "match_following"
  | "assertion_reason";

interface ExamQuestion {
  question_id?: string;
  id?: string;
  question_text?: string;
  text?: string;
  question_type?: QuestionType;
  type?: QuestionType;
  options?: string[];
  marks?: number;
  pairs?: { left: string; right: string }[];
  match_left?: string[];
  match_right?: string[];
  assertion?: string;
  reason?: string;
  assertion_options?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExamStatus(exam: any): string {
  const status = (
    exam.status ??
    exam.exam_status ??
    ""
  ).toLowerCase();
  if (status === "results_declared" || status === "declared") return "results_declared";
  if (status === "completed" || status === "ended") return "completed";
  if (status === "in_progress" || status === "ongoing" || status === "live") return "in_progress";
  return "upcoming";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "upcoming":
      return { label: "Upcoming", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" };
    case "in_progress":
      return { label: "In Progress", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" };
    case "completed":
      return { label: "Completed", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" };
    case "results_declared":
      return { label: "Results Declared", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" };
    default:
      return { label: "Upcoming", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" };
  }
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

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getQuestionId(q: ExamQuestion): string {
  return q.question_id ?? q.id ?? "";
}

function getQuestionText(q: ExamQuestion): string {
  return q.question_text ?? q.text ?? "";
}

function getQuestionType(q: ExamQuestion): QuestionType {
  return (q.question_type ?? q.type ?? "mcq") as QuestionType;
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

const questionSlideLeft: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2, ease: "easeIn" } },
};

const questionSlideRight: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.2, ease: "easeIn" } },
};

const optionSpring: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Exams</h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              {count} exam{count !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Best of luck</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Exam Card (list mode)
// ---------------------------------------------------------------------------

function ExamCard({
  exam,
  onStart,
}: {
  exam: any;
  onStart: (exam: any) => void;
}) {
  const status = getExamStatus(exam);
  const badge = getStatusBadge(status);
  const examName = exam.title ?? exam.name ?? exam.exam_name ?? "Exam";
  const subjectName = exam.subject_name ?? exam.subjectName ?? "";
  const examDate = exam.date ?? exam.exam_date ?? exam.start_date ?? exam.scheduled_date ?? "";
  const duration = exam.duration ?? exam.duration_minutes ?? null;
  const totalMarks = exam.total_marks ?? exam.max_marks ?? null;
  const score = exam.score ?? exam.marks_obtained ?? exam.obtained_marks ?? null;
  const grade = exam.grade ?? null;
  const canStart = status === "upcoming" || status === "in_progress";

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <Card className="relative overflow-hidden border border-border/60 bg-white hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm flex-shrink-0">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-foreground truncate group-hover:text-brand-primary transition-colors duration-200">
                  {examName}
                </h3>
                <Badge
                  variant="outline"
                  className={`border-transparent ${badge.className} flex-shrink-0 text-[11px]`}
                >
                  {badge.label}
                </Badge>
              </div>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
                {subjectName && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {subjectName}
                  </span>
                )}
                {examDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(examDate)}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {duration} min
                  </span>
                )}
                {totalMarks && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {totalMarks} marks
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Score for completed/declared exams */}
                {(status === "completed" || status === "results_declared") && score !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-extrabold text-emerald-700">
                        {score}
                        {totalMarks ? (
                          <span className="text-xs font-normal text-emerald-600/70">/{totalMarks}</span>
                        ) : null}
                      </span>
                      {grade && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] ml-1"
                        >
                          {grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Start button */}
                {canStart && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(exam);
                    }}
                    className="bg-gradient-to-r from-brand-primary to-violet-600 hover:from-brand-primary/90 hover:to-violet-600/90 text-white shadow-sm ml-auto"
                    size="sm"
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Start Exam
                  </Button>
                )}

                {status === "results_declared" && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium ml-auto">
                    <Eye className="h-3.5 w-3.5" />
                    Results Available
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Hover accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Question Type Renderers
// ---------------------------------------------------------------------------

function MCQRenderer({
  question,
  answer,
  onChange,
}: {
  question: ExamQuestion;
  answer: any;
  onChange: (val: any) => void;
}) {
  const options = question.options ?? [];
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="space-y-3">
      {options.map((opt, idx) => {
        const isSelected = answer === idx || answer === opt || answer === labels[idx];
        return (
          <motion.button
            key={idx}
            variants={optionSpring}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(idx)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                : "border-border/60 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm flex-shrink-0 transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {labels[idx]}
            </div>
            <span
              className={`text-sm leading-relaxed ${
                isSelected ? "font-semibold text-indigo-900" : "text-foreground"
              }`}
            >
              {opt}
            </span>
            {isSelected && (
              <CheckCircle2 className="h-5 w-5 text-indigo-500 ml-auto flex-shrink-0" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function TrueFalseRenderer({
  answer,
  onChange,
}: {
  answer: any;
  onChange: (val: any) => void;
}) {
  const options = [
    { label: "True", value: true },
    { label: "False", value: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt) => {
        const isSelected = answer === opt.value;
        return (
          <motion.button
            key={opt.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
              isSelected
                ? opt.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-red-500 bg-red-50 text-red-700 shadow-sm"
                : "border-border/60 bg-white text-foreground hover:border-indigo-200"
            }`}
          >
            {isSelected && opt.value && <CheckCircle2 className="h-6 w-6" />}
            {isSelected && !opt.value && <XCircle className="h-6 w-6" />}
            {!isSelected && (
              <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
            )}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function ShortAnswerRenderer({
  answer,
  onChange,
}: {
  answer: any;
  onChange: (val: any) => void;
}) {
  return (
    <Textarea
      value={answer ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here..."
      rows={4}
      className="text-sm resize-none"
    />
  );
}

function LongAnswerRenderer({
  answer,
  onChange,
}: {
  answer: any;
  onChange: (val: any) => void;
}) {
  return (
    <Textarea
      value={answer ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your detailed answer here..."
      rows={8}
      className="text-sm resize-y min-h-[200px]"
    />
  );
}

function FillBlankRenderer({
  answer,
  onChange,
}: {
  answer: any;
  onChange: (val: any) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground font-medium">Answer:</span>
      <Input
        value={answer ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        className="max-w-md text-sm"
      />
    </div>
  );
}

function MatchFollowingRenderer({
  question,
  answer,
  onChange,
}: {
  question: ExamQuestion;
  answer: any;
  onChange: (val: any) => void;
}) {
  const pairs = question.pairs ?? [];
  const leftItems = question.match_left ?? pairs.map((p) => p.left);
  const rightItems = question.match_right ?? pairs.map((p) => p.right);
  const currentMatches: Record<string, string> = answer ?? {};

  const handleMatch = (leftItem: string, rightItem: string) => {
    onChange({ ...currentMatches, [leftItem]: rightItem });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-medium mb-2">
        Match items from Column A to Column B
      </p>
      <div className="space-y-3">
        {leftItems.map((left, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="flex-1 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-900">
              {left}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Select
                value={currentMatches[left] ?? ""}
                onValueChange={(val) => handleMatch(left, val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select match..." />
                </SelectTrigger>
                <SelectContent>
                  {rightItems.map((right, rIdx) => (
                    <SelectItem key={rIdx} value={right}>
                      {right}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssertionReasonRenderer({
  question,
  answer,
  onChange,
}: {
  question: ExamQuestion;
  answer: any;
  onChange: (val: any) => void;
}) {
  const assertion = question.assertion ?? "";
  const reason = question.reason ?? "";
  const arOptions = question.assertion_options ?? [
    "Both A and R are true, and R is the correct explanation of A",
    "Both A and R are true, but R is NOT the correct explanation of A",
    "A is true but R is false",
    "A is false but R is true",
  ];
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4">
      {/* Assertion & Reason display */}
      {(assertion || reason) && (
        <div className="space-y-3 mb-4">
          {assertion && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                Assertion (A)
              </p>
              <p className="text-sm text-blue-900 leading-relaxed">{assertion}</p>
            </div>
          )}
          {reason && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                Reason (R)
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">{reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Option cards */}
      <div className="space-y-3">
        {arOptions.map((opt, idx) => {
          const isSelected = answer === idx || answer === opt;
          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(idx)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                  : "border-border/60 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs flex-shrink-0 transition-all duration-200 ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {labels[idx]}
              </div>
              <span
                className={`text-sm leading-relaxed ${
                  isSelected ? "font-semibold text-indigo-900" : "text-foreground"
                }`}
              >
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionRenderer({
  question,
  answer,
  onChange,
}: {
  question: ExamQuestion;
  answer: any;
  onChange: (val: any) => void;
}) {
  const qType = getQuestionType(question);

  switch (qType) {
    case "mcq":
      return <MCQRenderer question={question} answer={answer} onChange={onChange} />;
    case "true_false":
      return <TrueFalseRenderer answer={answer} onChange={onChange} />;
    case "short_answer":
      return <ShortAnswerRenderer answer={answer} onChange={onChange} />;
    case "long_answer":
      return <LongAnswerRenderer answer={answer} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankRenderer answer={answer} onChange={onChange} />;
    case "match_following":
      return <MatchFollowingRenderer question={question} answer={answer} onChange={onChange} />;
    case "assertion_reason":
      return <AssertionReasonRenderer question={question} answer={answer} onChange={onChange} />;
    default:
      return <ShortAnswerRenderer answer={answer} onChange={onChange} />;
  }
}

// ---------------------------------------------------------------------------
// Fullscreen Exam Mode
// ---------------------------------------------------------------------------

function ExamMode({
  exam,
  attemptId,
  questions,
  onExit,
}: {
  exam: any;
  attemptId: string;
  questions: ExamQuestion[];
  onExit: () => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [navDirection, setNavDirection] = useState<"left" | "right">("right");

  const saveAnswerMutation = useSaveAnswer();
  const submitAttemptMutation = useSubmitAttempt();
  const recordViolation = useRecordViolation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const examName = exam.title ?? exam.name ?? exam.exam_name ?? "Exam";
  const duration = exam.duration ?? exam.duration_minutes ?? 60;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const currentQId = currentQuestion ? getQuestionId(currentQuestion) : "";

  // Initialize timer
  useEffect(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          handleSubmitExam();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => v + 1);
        recordViolation.mutate({
          attemptId,
          data: { violation_type: "tab_switch" },
        });
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning("Please stay in fullscreen during the exam");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(
    (questionId: string, answerValue: any) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveAnswerMutation.mutate({
          attemptId,
          data: { question_id: questionId, answer: answerValue },
        });
      }, 1000);
    },
    [attemptId, saveAnswerMutation],
  );

  const handleAnswerChange = useCallback(
    (val: any) => {
      if (!currentQId) return;
      setAnswers((prev) => ({ ...prev, [currentQId]: val }));
      scheduleAutoSave(currentQId, val);
    },
    [currentQId, scheduleAutoSave],
  );

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setNavDirection("left");
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setNavDirection("right");
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex);
      } else {
        next.add(currentQuestionIndex);
      }
      return next;
    });
  };

  const handleClear = () => {
    if (!currentQId) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQId];
      return next;
    });
  };

  const handleSubmitExam = useCallback(() => {
    submitAttemptMutation.mutate(attemptId, {
      onSuccess: () => {
        document.exitFullscreen?.().catch(() => {});
        onExit();
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, onExit]);

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== "",
  ).length;
  const flaggedCount = flagged.size;
  const remainingCount = totalQuestions - answeredCount;
  const unansweredCount = totalQuestions - answeredCount;

  const isTimeLow = timeLeft <= 300; // 5 minutes

  const getQuestionDotStyle = (idx: number) => {
    const qId = getQuestionId(questions[idx]);
    if (idx === currentQuestionIndex) return "bg-indigo-500 text-white";
    if (flagged.has(idx)) return "bg-amber-500 text-white";
    if (answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== "")
      return "bg-emerald-500 text-white";
    return "bg-white/10 text-slate-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <ClipboardList className="h-5 w-5 text-brand-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{examName}</p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Timer
            className={`h-5 w-5 ${isTimeLow ? "text-red-500" : "text-muted-foreground"}`}
          />
          <span
            className={`font-mono text-lg font-bold tracking-wider ${
              isTimeLow ? "text-red-500 animate-pulse" : "text-foreground"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Violations + fullscreen */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
              violations > 0
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-gray-50 text-muted-foreground border border-border/40"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            {violations} violation{violations !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - question nav */}
        <div className="w-16 bg-[#1E1B4B] flex flex-col items-center py-4 flex-shrink-0 overflow-y-auto">
          <div className="space-y-2 flex-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNavDirection(idx > currentQuestionIndex ? "right" : "left");
                  setCurrentQuestionIndex(idx);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 hover:scale-110 ${getQuestionDotStyle(idx)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Status summary */}
          <div className="mt-4 px-1 text-center space-y-1">
            <div className="flex items-center gap-1 justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-slate-400">{answeredCount}</span>
            </div>
            <div className="flex items-center gap-1 justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[9px] text-slate-400">{flaggedCount}</span>
            </div>
            <div className="flex items-center gap-1 justify-center">
              <div className="h-2 w-2 rounded-full bg-white/10" />
              <span className="text-[9px] text-slate-400">{remainingCount}</span>
            </div>
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                variants={navDirection === "right" ? questionSlideLeft : questionSlideRight}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-3xl mx-auto"
              >
                {/* Question label */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-bold"
                  >
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </Badge>
                  {currentQuestion?.marks && (
                    <Badge
                      variant="outline"
                      className="border-border/40 text-muted-foreground hover:bg-transparent"
                    >
                      {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {flagged.has(currentQuestionIndex) && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </div>

                {/* Question text */}
                <div className="mb-8">
                  <p className="text-lg font-medium text-foreground leading-relaxed">
                    {currentQuestion ? getQuestionText(currentQuestion) : ""}
                  </p>
                </div>

                {/* Answer area */}
                {currentQuestion && (
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQId]}
                    onChange={handleAnswerChange}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 md:px-12 h-16 bg-white border-t border-border/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlag}
                className={
                  flagged.has(currentQuestionIndex)
                    ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    : ""
                }
              >
                <Flag className="h-3.5 w-3.5 mr-1" />
                {flagged.has(currentQuestionIndex) ? "Unflag" : "Flag"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSubmitDialog(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              {unansweredCount > 0
                ? `You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? "s" : ""}. Are you sure you want to submit?`
                : "Are you sure you want to submit this exam? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Answered: {answeredCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Flagged: {flaggedCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full bg-gray-300" />
              <span className="text-muted-foreground">Unanswered: {unansweredCount}</span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" />}
            >
              Go Back
            </DialogClose>
            <Button
              onClick={() => {
                setShowSubmitDialog(false);
                handleSubmitExam();
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              disabled={submitAttemptMutation.isPending}
            >
              {submitAttemptMutation.isPending ? "Submitting..." : "Submit Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exam List
// ---------------------------------------------------------------------------

function ExamList({
  exams,
  isLoading,
  onStart,
}: {
  exams: any[];
  isLoading: boolean;
  onStart: (exam: any) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground mb-1">No exams yet</p>
          <p className="text-xs text-muted-foreground/60">
            Upcoming exams will appear here
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
      {exams.map((exam: any) => {
        const examId = exam.exam_id ?? exam.id ?? String(Math.random());
        return <ExamCard key={examId} exam={exam} onStart={onStart} />;
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentExamsPage() {
  const [inExamMode, setInExamMode] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);

  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id ?? "";

  const { data: examsRaw, isLoading: examsLoading } = useExams();
  const exams = useMemo(() => extractArray(examsRaw), [examsRaw]);

  const startAttempt = useStartAttempt();

  const { data: attemptData } = useAttempt(activeAttemptId ?? undefined);

  // When attempt data loads, extract questions
  useEffect(() => {
    if (attemptData) {
      const qs =
        attemptData.questions ??
        attemptData.exam?.questions ??
        attemptData.data?.questions ??
        [];
      if (qs.length > 0 && examQuestions.length === 0) {
        setExamQuestions(qs);
      }
    }
  }, [attemptData, examQuestions.length]);

  const handleStartExam = useCallback(
    (exam: any) => {
      const examId = exam.exam_id ?? exam.id ?? "";
      if (!examId || !studentId) {
        toast.error("Unable to start exam. Please try again.");
        return;
      }

      startAttempt.mutate(
        { examId, studentId },
        {
          onSuccess: (data: any) => {
            const attempt = data?.attempt ?? data?.data?.attempt ?? data;
            const aId = attempt?.attempt_id ?? attempt?.id ?? data?.attempt_id ?? data?.id ?? "";
            const qs =
              attempt?.questions ??
              data?.questions ??
              data?.exam?.questions ??
              exam.questions ??
              [];

            if (!aId) {
              toast.error("Failed to get attempt ID");
              return;
            }

            setActiveAttemptId(aId);
            setActiveExam(exam);
            setExamQuestions(qs);
            setInExamMode(true);

            // Enter fullscreen
            document.documentElement.requestFullscreen?.().catch(() => {
              // Fullscreen may be blocked; continue anyway
            });
          },
          onError: () => {
            toast.error("Failed to start exam. Please try again.");
          },
        },
      );
    },
    [studentId, startAttempt],
  );

  const handleExitExam = useCallback(() => {
    setInExamMode(false);
    setActiveAttemptId(null);
    setActiveExam(null);
    setExamQuestions([]);
    document.exitFullscreen?.().catch(() => {});
  }, []);

  const isLoading = studentLoading || examsLoading;

  // Fullscreen exam mode
  if (inExamMode && activeAttemptId && activeExam) {
    return (
      <ExamMode
        exam={activeExam}
        attemptId={activeAttemptId}
        questions={examQuestions}
        onExit={handleExitExam}
      />
    );
  }

  // Exam list mode (default)
  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key="exam-list"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideIn}
        >
          <PageBanner count={exams.length} isLoading={isLoading} />
          <ExamList exams={exams} isLoading={isLoading} onStart={handleStartExam} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
