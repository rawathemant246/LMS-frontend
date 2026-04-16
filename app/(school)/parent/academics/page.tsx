"use client";

import { useState, useEffect, useMemo } from "react";
import { getCookie } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractArray, formatDate } from "@/lib/utils";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import { useStudentGradebook } from "@/hooks/use-student-insights";
import { useStudentReportCards } from "@/hooks/use-gradebook";
import { useExams } from "@/hooks/use-exams";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  Download,
  Eye,
  Award,
  TrendingUp,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
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
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Academics
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Gradebook, report cards, and exam results at a glance
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Academic Insights</span>
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
              const name =
                `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() ||
                "Child";
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
// Helpers
// ---------------------------------------------------------------------------

function computeGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 33) return "D";
  return "F";
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "text-emerald-600";
  if (grade === "B+" || grade === "B") return "text-blue-600";
  if (grade === "C") return "text-amber-600";
  return "text-red-600";
}

// ---------------------------------------------------------------------------
// Gradebook Tab
// ---------------------------------------------------------------------------

function GradebookTab({
  childId,
  isLoading,
}: {
  childId: string;
  isLoading: boolean;
}) {
  const { data: gradebookRaw, isLoading: gbLoading } =
    useStudentGradebook(childId || undefined);
  const grades = useMemo(() => extractArray(gradebookRaw), [gradebookRaw]);

  const loading = isLoading || gbLoading;

  const overallPct = useMemo(() => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc: number, g: any) => {
      const obtained = Number(
        g.marks_obtained ?? g.marksObtained ?? g.score ?? 0
      );
      const max = Number(g.max_marks ?? g.maxMarks ?? g.total ?? 100);
      return acc + (max > 0 ? (obtained / max) * 100 : 0);
    }, 0);
    return Math.round(sum / grades.length);
  }, [grades]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            No gradebook data yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
            Grades will appear here once your child&apos;s assessments are recorded
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
      className="space-y-6"
    >
      {/* Overall Summary Card */}
      <motion.div variants={fadeSlideUp}>
        <Card className="relative overflow-hidden border border-violet-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Overall Performance
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    {overallPct}%
                  </span>
                  <Badge
                    className={`text-xs font-bold ${
                      overallPct >= 75
                        ? "bg-emerald-100 text-emerald-700"
                        : overallPct >= 50
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {computeGrade(overallPct)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {grades.length} subject{grades.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 shadow-sm">
                <Award className="h-7 w-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
          <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 bg-violet-100" />
        </Card>
      </motion.div>

      {/* Gradebook Table */}
      <motion.div variants={fadeSlideUp}>
        <Card className="border border-border/60 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="px-6 pt-5 pb-3 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-brand-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Subject-wise Marks
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Subject
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Exam
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                    Marks
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                    Max
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">
                    Grade
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((g: any, idx: number) => {
                  const subject =
                    g.subject_name ?? g.subjectName ?? g.subject ?? "---";
                  const exam =
                    g.exam_name ?? g.examName ?? g.assessment ?? g.title ?? "---";
                  const obtained = Number(
                    g.marks_obtained ?? g.marksObtained ?? g.score ?? 0
                  );
                  const max = Number(
                    g.max_marks ?? g.maxMarks ?? g.total ?? 100
                  );
                  const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
                  const grade =
                    g.grade ?? g.letter_grade ?? computeGrade(pct);

                  return (
                    <TableRow key={g.id ?? idx} className="group">
                      <TableCell className="font-medium text-foreground">
                        {subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {exam}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {obtained}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {max}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold text-sm ${gradeColor(grade)}`}
                        >
                          {grade}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Report Cards Tab
// ---------------------------------------------------------------------------

function ReportCardsTab({
  childId,
  isLoading,
}: {
  childId: string;
  isLoading: boolean;
}) {
  const { data: rcRaw, isLoading: rcLoading } = useStudentReportCards(
    childId || undefined
  );
  const reportCards = useMemo(() => extractArray(rcRaw), [rcRaw]);

  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const loading = isLoading || rcLoading;

  const handleViewPdf = async (id: string) => {
    const token =
      getCookie("access_token") || "";
    const res = await fetch(
      `${API_BASE}/api/v1/report-cards/${id}/pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.status === 401) {
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      toast.error("Failed to load report card");
      return;
    }
    const url = URL.createObjectURL(await res.blob());
    setPdfUrl(url);
    setShowPdf(true);
  };

  const handleDownloadPdf = async (id: string) => {
    const token =
      getCookie("access_token") || "";
    const url = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    }/api/v1/report-cards/${id}/pdf`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      toast.error("Failed to download report card");
      return;
    }
    const blobUrl = URL.createObjectURL(await res.blob());
    window.open(blobUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            No report cards available
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
            Report cards will appear here once they are generated by the school
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {reportCards.map((rc: any) => {
          const id = rc.id ?? rc.report_card_id ?? "";
          const title =
            rc.title ??
            rc.term_name ??
            rc.termName ??
            rc.exam_name ??
            rc.examName ??
            "Report Card";
          const date = rc.date ?? rc.created_at ?? rc.generated_at ?? "";
          const status = (
            rc.status ?? "generated"
          ).toLowerCase();
          const isPublished = status === "published";

          return (
            <motion.div
              key={id}
              variants={fadeSlideUp}
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 shadow-sm">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {date ? formatDate(date) : ""}
                </p>
              </div>
              <Badge
                className={`text-[10px] font-bold ${
                  isPublished
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPublished ? "Published" : "Generated"}
              </Badge>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleViewPdf(id)}
                  title="View"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleDownloadPdf(id)}
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* PDF Viewer Dialog */}
      <Dialog
        open={showPdf}
        onOpenChange={(open) => {
          if (!open) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl("");
          }
          setShowPdf(open);
        }}
      >
        <DialogContent className="sm:max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report Card</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 -mx-4">
            {pdfUrl && (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full min-h-[60vh]"
              >
                <p className="p-4 text-center text-muted-foreground text-sm">
                  Unable to display PDF.{" "}
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary underline"
                  >
                    Open in new tab
                  </a>
                </p>
              </object>
            )}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exam Results Tab
// ---------------------------------------------------------------------------

function ExamResultsTab({
  childId,
  selectedChild,
  isLoading,
}: {
  childId: string;
  selectedChild: any;
  isLoading: boolean;
}) {
  const { data: examsRaw, isLoading: examsLoading } = useExams();
  const allExams = useMemo(() => extractArray(examsRaw), [examsRaw]);

  const loading = isLoading || examsLoading;

  // Filter exams relevant to the child's section/class
  const childSection = selectedChild?.section_id ?? selectedChild?.sectionId ?? "";
  const childClass = selectedChild?.class_id ?? selectedChild?.classId ?? "";

  const relevantExams = useMemo(() => {
    return allExams.filter((e: any) => {
      const examSection = e.section_id ?? e.sectionId ?? "";
      const examClass = e.class_id ?? e.classId ?? "";
      // Show if matches section, class, or is school-wide (no section filter)
      if (examSection && childSection && examSection === childSection) return true;
      if (examClass && childClass && examClass === childClass) return true;
      if (!examSection && !examClass) return true;
      return false;
    });
  }, [allExams, childSection, childClass]);

  // Also derive per-child results from gradebook
  const { data: gradebookRaw } = useStudentGradebook(childId || undefined);
  const grades = useMemo(() => extractArray(gradebookRaw), [gradebookRaw]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  // If we have gradebook-level results, show them as exam results
  if (grades.length > 0) {
    return (
      <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
        <Card className="border border-border/60 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="px-6 pt-5 pb-3 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-brand-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Exam Results
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Exam
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Subject
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                    Score
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                    Max Marks
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">
                    Grade
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((g: any, idx: number) => {
                  const exam =
                    g.exam_name ?? g.examName ?? g.assessment ?? g.title ?? "---";
                  const subject =
                    g.subject_name ?? g.subjectName ?? g.subject ?? "---";
                  const obtained = Number(
                    g.marks_obtained ?? g.marksObtained ?? g.score ?? 0
                  );
                  const max = Number(
                    g.max_marks ?? g.maxMarks ?? g.total ?? 100
                  );
                  const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
                  const grade = g.grade ?? g.letter_grade ?? computeGrade(pct);
                  const date =
                    g.date ?? g.exam_date ?? g.created_at ?? "";

                  return (
                    <TableRow key={g.id ?? idx} className="group">
                      <TableCell className="font-medium text-foreground">
                        {exam}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subject}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {obtained}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {max}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold text-sm ${gradeColor(grade)}`}
                        >
                          {grade}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {date ? formatDate(date) : "---"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (relevantExams.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            No exam results available
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
            Results will appear here once exams are conducted and graded
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
      {relevantExams.map((exam: any) => {
        const id = exam.id ?? "";
        const name = exam.name ?? exam.title ?? "Exam";
        const subject = exam.subject_name ?? exam.subjectName ?? exam.subject ?? "";
        const date = exam.date ?? exam.exam_date ?? exam.start_date ?? "";
        const status = (exam.status ?? "").toLowerCase();

        return (
          <motion.div
            key={id}
            variants={fadeSlideUp}
            whileHover={{ x: 4 }}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 shadow-sm">
              <ClipboardList className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subject ? `${subject} - ` : ""}
                {date ? formatDate(date) : ""}
              </p>
            </div>
            <Badge
              className={`text-[10px] font-bold ${
                status === "published" || status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "scheduled"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status || "pending"}
            </Badge>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ParentAcademicsPage() {
  const { data: parent, isLoading: parentLoading } = useParentProfile();
  const parentId = parent?.id;
  const { data: childrenRaw, isLoading: childrenLoading } =
    useParentChildren(parentId);
  const children = useMemo(() => extractArray(childrenRaw), [childrenRaw]);

  const [selectedChildId, setSelectedChildId] = useState<string>("");

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(
        String(children[0].student_id ?? children[0].id ?? "")
      );
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find(
    (c: any) => String(c.student_id ?? c.id ?? "") === selectedChildId
  );

  const isLoading = parentLoading || childrenLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={(v) => v && setSelectedChildId(v)}
      />

      <Tabs defaultValue="gradebook" className="space-y-6">
        <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-px">
          <TabsTrigger value="gradebook" className="gap-1.5 px-4">
            <BarChart3 className="h-3.5 w-3.5" />
            Gradebook
          </TabsTrigger>
          <TabsTrigger value="report-cards" className="gap-1.5 px-4">
            <FileText className="h-3.5 w-3.5" />
            Report Cards
          </TabsTrigger>
          <TabsTrigger value="exam-results" className="gap-1.5 px-4">
            <ClipboardList className="h-3.5 w-3.5" />
            Exam Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gradebook">
          <GradebookTab childId={selectedChildId} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="report-cards">
          <ReportCardsTab childId={selectedChildId} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="exam-results">
          <ExamResultsTab
            childId={selectedChildId}
            selectedChild={selectedChild}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
