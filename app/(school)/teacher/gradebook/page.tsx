"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { getCookie } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Save,
  FileText,
  ChevronRight,
  Download,
  Eye,
  BookOpen,
  BarChart3,
  ClipboardList,
  Users,
  Award,
  PenLine,
  Layers,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { extractArray } from "@/lib/utils";
import {
  useTeacherProfile,
  useMyClasses,
  useMySubjects,
  useTeacherAssignments,
} from "@/hooks/use-teacher-context";
import { useExams, useExam, useExamResults, useBulkMarks } from "@/hooks/use-exams";
import { useGradeScales, useReportCardPdf } from "@/hooks/use-gradebook";
import { useSectionStudents } from "@/hooks/use-attendance";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGrade(total: number, maxTotal: number, entries: any[]): string {
  if (maxTotal === 0) return "\u2014";
  const pct = (total / maxTotal) * 100;
  const entry = entries.find(
    (e: any) => pct >= e.min_percentage && pct <= e.max_percentage
  );
  return entry?.grade_label ?? "\u2014";
}

function getGradeColor(grade: string): string {
  if (grade === "A+" || grade === "A1" || grade === "A") return "bg-green-100 text-green-700";
  if (grade === "B+" || grade === "B1" || grade === "B" || grade === "A2") return "bg-blue-100 text-blue-700";
  if (grade === "C+" || grade === "C" || grade === "B2" || grade === "C1") return "bg-amber-100 text-amber-700";
  if (grade === "D" || grade === "C2" || grade === "D1" || grade === "D2") return "bg-orange-100 text-orange-700";
  if (grade === "\u2014") return "bg-gray-100 text-gray-500";
  return "bg-red-100 text-red-700";
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

const tabFade: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const expandCollapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

// ---------------------------------------------------------------------------
// Scale type badge
// ---------------------------------------------------------------------------

const SCALE_TYPE_COLORS: Record<string, string> = {
  percentage: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  grade_point: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  marks: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

// ---------------------------------------------------------------------------
// Report card status badge
// ---------------------------------------------------------------------------

const RC_STATUS_COLORS: Record<string, string> = {
  not_generated: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  generated: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  published: "bg-green-100 text-green-700 hover:bg-green-100",
};

function RCStatusBadge({ status }: { status: string }) {
  const cls = RC_STATUS_COLORS[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cls}`}>
      {status?.replace(/_/g, " ") || "Not Generated"}
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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-[#059669] to-[#0D9488] p-6 md:p-8 text-white mb-8"
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
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gradebook</h1>
          <p className="text-sm text-white/70 font-medium mt-0.5">
            Marks entry, internal assessments, grades, and report cards
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 -- Marks Entry (same as admin, pre-filtered to teacher's exams)
// ---------------------------------------------------------------------------

function MarksEntryTab({ sectionIds, mySubjectIds }: { sectionIds: string[]; mySubjectIds: Set<string> }) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [savedCells, setSavedCells] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const { data: examsData } = useExams();
  const allExams = extractArray(examsData);
  // Filter exams to only include those matching teacher's subject IDs
  const teacherExams = useMemo(() => {
    if (mySubjectIds.size === 0) return allExams;
    return allExams.filter((e: any) => mySubjectIds.has(String(e.subject_id ?? "")));
  }, [allExams, mySubjectIds]);

  const { data: examData } = useExam(selectedExamId || undefined);
  const { data: resultsData, isLoading: resultsLoading } = useExamResults(selectedExamId || undefined);
  const results = extractArray(resultsData);

  const { data: gradeScalesData } = useGradeScales();
  const gradeScales = extractArray(gradeScalesData);
  const defaultScale = gradeScales[0];
  const scaleEntries = extractArray(defaultScale?.entries ?? defaultScale?.grade_entries ?? []);

  const bulkMarksMutation = useBulkMarks();

  // Paper sections from exam data
  const paperSections = useMemo(() => {
    const exam = examData as any;
    if (!exam) return [];
    const papers = extractArray(exam.exam_papers ?? exam.papers ?? exam.data?.exam_papers ?? exam.data?.papers ?? []);
    const allSections: any[] = [];
    for (const paper of papers) {
      const secs = extractArray(paper.sections ?? paper.exam_paper_sections ?? []);
      for (const sec of secs) {
        allSections.push({
          id: String(sec.exam_paper_section_id ?? sec.section_id ?? sec.id ?? ""),
          label: sec.section_name ?? sec.name ?? sec.label ?? `Section ${allSections.length + 1}`,
          max_marks: Number(sec.max_marks ?? sec.total_marks ?? 0),
          paper_name: paper.paper_name ?? paper.name ?? paper.subject_name ?? "",
        });
      }
    }
    if (allSections.length === 0 && exam) {
      const totalMarks = Number(exam.total_marks ?? exam.data?.total_marks ?? 100);
      allSections.push({ id: "total", label: "Total", max_marks: totalMarks, paper_name: "" });
    }
    return allSections;
  }, [examData]);

  const maxTotal = useMemo(() => paperSections.reduce((sum, s) => sum + s.max_marks, 0), [paperSections]);

  // Filter results by teacher's sections
  const filteredResults = useMemo(() => {
    if (sectionIds.length === 0) return results;
    return results.filter((r: any) => {
      const secId = String(r.section_id ?? r.student?.section_id ?? "");
      return sectionIds.includes(secId) || !secId;
    });
  }, [results, sectionIds]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a: any, b: any) => {
      const ra = Number(a.roll_number ?? a.roll_no ?? a.student?.roll_number ?? 0);
      const rb = Number(b.roll_number ?? b.roll_no ?? b.student?.roll_number ?? 0);
      return ra - rb;
    });
  }, [filteredResults]);

  const getStudentMark = useCallback(
    (studentId: string, sectionId: string): number => {
      if (marks[studentId]?.[sectionId] !== undefined) return marks[studentId][sectionId];
      const result = results.find((r: any) => String(r.student_id ?? r.student?.id ?? "") === studentId);
      if (!result) return 0;
      const sectionMarks = extractArray(result.section_marks ?? result.marks_breakdown ?? []);
      const found = sectionMarks.find((m: any) => String(m.exam_paper_section_id ?? m.section_id ?? m.id ?? "") === sectionId);
      if (found) return Number(found.marks_obtained ?? found.marks ?? found.score ?? 0);
      if (sectionId === "total") return Number(result.total_marks ?? result.marks ?? result.total ?? 0);
      return 0;
    },
    [marks, results]
  );

  const handleMarkChange = (studentId: string, sectionId: string, value: number) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? {}), [sectionId]: value } }));
  };

  const getStudentTotal = (studentId: string): number => {
    return paperSections.reduce((sum, sec) => sum + getStudentMark(studentId, sec.id), 0);
  };

  const handleSaveAll = () => {
    if (!selectedExamId) return;
    const entries: any[] = [];
    for (const r of sortedResults) {
      const studentId = String(r.student_id ?? r.student?.id ?? "");
      const sectionMarks: any[] = [];
      for (const sec of paperSections) {
        sectionMarks.push({ exam_paper_section_id: sec.id, marks_obtained: getStudentMark(studentId, sec.id) });
      }
      entries.push({ student_id: studentId, section_marks: sectionMarks, total_marks: getStudentTotal(studentId) });
    }
    bulkMarksMutation.mutate(
      { examId: selectedExamId, data: { marks: entries } },
      {
        onSuccess: () => {
          const allKeys = new Set<string>();
          for (const r of sortedResults) {
            const sid = String(r.student_id ?? r.student?.id ?? "");
            for (const sec of paperSections) allKeys.add(`${sid}-${sec.id}`);
          }
          setSavedCells(allKeys);
          setTimeout(() => setSavedCells(new Set()), 1200);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentIdx: number, sectionIdx: number) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const nextSec = sectionIdx + 1;
      if (nextSec < paperSections.length) {
        inputRefs.current.get(`${studentIdx}-${nextSec}`)?.focus();
      } else if (studentIdx + 1 < sortedResults.length) {
        inputRefs.current.get(`${studentIdx + 1}-0`)?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (studentIdx + 1 < sortedResults.length) {
        inputRefs.current.get(`${studentIdx + 1}-${sectionIdx}`)?.focus();
      }
    }
  };

  const classAverage = useMemo(() => {
    if (sortedResults.length === 0) return 0;
    const totals = sortedResults.map((r: any) => getStudentTotal(String(r.student_id ?? r.student?.id ?? "")));
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }, [sortedResults, getStudentTotal]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={selectedExamId} onValueChange={(val) => { setSelectedExamId(val ?? ""); setMarks({}); }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Exam" />
          </SelectTrigger>
          <SelectContent>
            {teacherExams.map((e: any) => (
              <SelectItem key={e.exam_id ?? e.id} value={String(e.exam_id ?? e.id)}>
                {e.name ?? e.title ?? "Exam"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedExamId && (
          <div className="ml-auto">
            <Button onClick={handleSaveAll} disabled={bulkMarksMutation.isPending || sortedResults.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {bulkMarksMutation.isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedExamId ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select an exam to enter marks</p>
          <p className="text-xs text-gray-400 mt-1">Choose an exam from the dropdown above</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sticky left-0 bg-white z-10">#</TableHead>
                <TableHead className="w-20 sticky left-10 bg-white z-10">Roll No</TableHead>
                <TableHead className="w-44 sticky left-28 bg-white z-10">Student Name</TableHead>
                {paperSections.map((sec) => (
                  <TableHead key={sec.id} className="text-center min-w-[100px]">
                    <div className="text-xs font-medium">{sec.label}</div>
                    {sec.paper_name && <div className="text-[10px] text-gray-400">{sec.paper_name}</div>}
                    <div className="text-[10px] text-gray-400">/{sec.max_marks}</div>
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[80px]">Total</TableHead>
                <TableHead className="text-center min-w-[70px]">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    {paperSections.map((sec) => (
                      <TableCell key={sec.id}><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 mx-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : sortedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3 + paperSections.length + 2} className="text-center text-gray-500 py-12">
                    No students found for this exam
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {sortedResults.map((r: any, studentIdx: number) => {
                    const studentId = String(r.student_id ?? r.student?.id ?? studentIdx);
                    const total = getStudentTotal(studentId);
                    const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                    const grade = scaleEntries.length > 0
                      ? getGrade(total, maxTotal, scaleEntries)
                      : pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 33 ? "D" : "F";
                    const rowBg = pct < 33 ? "bg-red-50" : pct > 90 ? "bg-green-50" : "";

                    return (
                      <motion.tr
                        key={studentId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: studentIdx * 0.03 }}
                        className={`border-b last:border-b-0 ${rowBg}`}
                      >
                        <TableCell className="text-gray-500 text-sm tabular-nums sticky left-0 bg-inherit z-10">{studentIdx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 sticky left-10 bg-inherit z-10">
                          {r.roll_number ?? r.roll_no ?? r.student?.roll_number ?? "\u2014"}
                        </TableCell>
                        <TableCell className="font-medium text-sm sticky left-28 bg-inherit z-10">
                          {r.student_name ?? r.student?.name ?? r.student?.full_name ?? (`${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.trim() || "Student")}
                        </TableCell>
                        {paperSections.map((sec, sectionIdx) => {
                          const val = getStudentMark(studentId, sec.id);
                          const isOver = val > sec.max_marks;
                          const cellKey = `${studentId}-${sec.id}`;
                          const isSaved = savedCells.has(cellKey);

                          return (
                            <TableCell key={sec.id} className="text-center px-1">
                              <input
                                ref={(el) => { if (el) inputRefs.current.set(`${studentIdx}-${sectionIdx}`, el); }}
                                type="number"
                                min={0}
                                max={sec.max_marks}
                                value={val}
                                onChange={(e) => handleMarkChange(studentId, sec.id, Number(e.target.value) || 0)}
                                onKeyDown={(e) => handleKeyDown(e, studentIdx, sectionIdx)}
                                className={`w-16 h-8 text-center text-sm tabular-nums rounded-md border px-1 outline-none transition-colors focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 ${
                                  isOver ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200"
                                } ${isSaved ? "bg-green-100" : ""}`}
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center tabular-nums text-sm font-semibold">{total}/{maxTotal}</TableCell>
                        <TableCell className="text-center">
                          <motion.div key={grade} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
                            <Badge variant="outline" className={`border-transparent ${getGradeColor(grade)}`}>{grade}</Badge>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
              {/* Class average footer */}
              {sortedResults.length > 0 && (
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={3} className="text-right text-sm text-gray-600 sticky left-0 bg-gray-50 z-10">Class Average</TableCell>
                  {paperSections.map((sec) => {
                    const avg = sortedResults.length > 0
                      ? sortedResults.reduce((sum: number, r: any) => sum + getStudentMark(String(r.student_id ?? r.student?.id ?? ""), sec.id), 0) / sortedResults.length
                      : 0;
                    return (
                      <TableCell key={sec.id} className="text-center text-sm tabular-nums text-gray-600">{avg.toFixed(1)}</TableCell>
                    );
                  })}
                  <TableCell className="text-center text-sm tabular-nums font-semibold text-gray-700">{classAverage.toFixed(1)}/{maxTotal}</TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 -- Internal Marks
// ---------------------------------------------------------------------------

const INTERNAL_CATEGORIES = ["Classwork", "Homework", "Project", "Lab Work"];

function InternalMarksTab({ sections }: { sections: any[] }) {
  const [selectedSectionId, setSelectedSectionId] = useState(
    sections.length > 0 ? String(sections[0].section_id ?? sections[0].id ?? "") : ""
  );
  const [internalMarks, setInternalMarks] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  const { data: studentsRaw, isLoading: studentsLoading } = useSectionStudents(selectedSectionId || undefined);
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a: any, b: any) => {
      const ra = Number(a.roll_number ?? a.roll_no ?? 0);
      const rb = Number(b.roll_number ?? b.roll_no ?? 0);
      return ra - rb;
    });
  }, [students]);

  const handleMarkChange = (studentId: string, category: string, value: number) => {
    setInternalMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [category]: value },
    }));
  };

  const getStudentMark = (studentId: string, category: string): number => {
    return internalMarks[studentId]?.[category] ?? 0;
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;
    setSaving(true);
    try {
      const entries: any[] = [];
      for (const student of sortedStudents) {
        const studentId = String(student.student_id ?? student.id ?? "");
        for (const category of INTERNAL_CATEGORIES) {
          const marks = getStudentMark(studentId, category);
          if (marks > 0) {
            entries.push({ student_id: studentId, category, marks, section_id: selectedSectionId });
          }
        }
      }
      if (entries.length > 0) {
        await api.post("/api/v1/internal-marks", { marks: entries });
        toast.success("Internal marks saved");
      } else {
        toast.info("No marks to save");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={selectedSectionId} onValueChange={(val) => { setSelectedSectionId(val ?? ""); setInternalMarks({}); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s: any) => (
              <SelectItem key={s.section_id ?? s.id} value={String(s.section_id ?? s.id)}>
                {s.class_name ?? ""} {s.section_name ?? s.name ?? "Section"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving || sortedStudents.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      {/* Internal marks grid */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-20">Roll No</TableHead>
              <TableHead className="w-44">Student Name</TableHead>
              {INTERNAL_CATEGORIES.map((cat) => (
                <TableHead key={cat} className="text-center min-w-[110px]">
                  <div className="text-xs font-medium">{cat}</div>
                  <div className="text-[10px] text-gray-400">/10</div>
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[80px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  {INTERNAL_CATEGORIES.map((cat) => (
                    <TableCell key={cat}><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                  ))}
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : sortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + INTERNAL_CATEGORIES.length + 1} className="text-center text-gray-500 py-12">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No students found in this section
                </TableCell>
              </TableRow>
            ) : (
              sortedStudents.map((student: any, idx: number) => {
                const studentId = String(student.student_id ?? student.id ?? idx);
                const name =
                  student.full_name ?? student.name ??
                  (`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Student");
                const rollNo = student.roll_number ?? student.roll_no ?? "\u2014";
                const total = INTERNAL_CATEGORIES.reduce((sum, cat) => sum + getStudentMark(studentId, cat), 0);

                return (
                  <motion.tr
                    key={studentId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b last:border-b-0"
                  >
                    <TableCell className="text-gray-500 text-sm tabular-nums">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{rollNo}</TableCell>
                    <TableCell className="font-medium text-sm">{name}</TableCell>
                    {INTERNAL_CATEGORIES.map((cat) => (
                      <TableCell key={cat} className="text-center px-1">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={getStudentMark(studentId, cat)}
                          onChange={(e) => handleMarkChange(studentId, cat, Number(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-sm tabular-nums rounded-md border border-gray-200 px-1 outline-none transition-colors focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center tabular-nums text-sm font-semibold">{total}/40</TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 3 -- Grade Scales (read-only)
// ---------------------------------------------------------------------------

function GradeScalesTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: scalesData, isLoading: scalesLoading } = useGradeScales();
  const scales = extractArray(scalesData);

  if (scalesLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scales.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No grade scales defined</p>
        <p className="text-xs text-gray-400 mt-1">Grade scales are managed by the school administrator</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
      {scales.map((scale: any) => {
        const scaleId = String(scale.grade_scale_id ?? scale.id ?? "");
        const isExpanded = expandedId === scaleId;
        const entries = extractArray(scale.entries ?? scale.grade_entries ?? []);
        const scaleTypeLower = (scale.scale_type ?? scale.type ?? "percentage").toLowerCase();
        const typeCls = SCALE_TYPE_COLORS[scaleTypeLower] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";

        return (
          <motion.div key={scaleId} variants={staggerItem}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : scaleId)}
                  className="flex items-center justify-between w-full p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{scale.name ?? "Unnamed Scale"}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{entries.length} grade entries</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`border-transparent capitalize ${typeCls}`}>
                    {scaleTypeLower.replace(/_/g, " ")}
                  </Badge>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div variants={expandCollapse} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
                      <div className="px-5 pb-5">
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Grade</TableHead>
                                <TableHead>Min %</TableHead>
                                <TableHead>Max %</TableHead>
                                <TableHead>Grade Point</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-gray-500 py-6">No entries defined</TableCell>
                                </TableRow>
                              ) : (
                                entries
                                  .sort((a: any, b: any) => (b.max_percentage ?? 0) - (a.max_percentage ?? 0))
                                  .map((entry: any, idx: number) => (
                                    <TableRow key={entry.id ?? idx}>
                                      <TableCell>
                                        <Badge variant="outline" className={`border-transparent ${getGradeColor(entry.grade_label ?? "")}`}>
                                          {entry.grade_label ?? "\u2014"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.min_percentage ?? 0}%</TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.max_percentage ?? 0}%</TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.grade_point ?? "\u2014"}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{entry.description ?? "\u2014"}</TableCell>
                                    </TableRow>
                                  ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TAB 4 -- Report Cards (read-only, can download PDFs)
// ---------------------------------------------------------------------------

function PdfViewerDialog({ reportCardId, studentName }: { reportCardId: string; studentName: string }) {
  const [open, setOpen] = useState(false);
  const { data: pdfUrl, isLoading: pdfLoading } = useReportCardPdf(open ? reportCardId : undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Eye className="h-3.5 w-3.5 mr-1" />
        View
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Card - {studentName}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 min-h-[500px]">
          {pdfLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                <p className="text-sm text-gray-500">Loading PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" className="w-full h-[500px] rounded-lg border">
              <p className="text-center text-gray-500 py-12">
                Unable to display PDF.{" "}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download instead</a>
              </p>
            </object>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-400">
              <p className="text-sm">Failed to load PDF</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportCardsTab({ sections }: { sections: any[] }) {
  const [selectedSectionId, setSelectedSectionId] = useState(
    sections.length > 0 ? String(sections[0].section_id ?? sections[0].id ?? "") : ""
  );

  const { data: studentsRaw, isLoading: studentsLoading } = useSectionStudents(selectedSectionId || undefined);
  const students = useMemo(() => extractArray(studentsRaw), [studentsRaw]);

  const handleDownloadPdf = async (reportCardId: string) => {
    try {
      const token = getCookie("access_token") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/report-cards/${reportCardId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        document.cookie = "access_token=; path=/; max-age=0";
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div>
      {/* Section selector */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={selectedSectionId} onValueChange={(val) => setSelectedSectionId(val ?? "")}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s: any) => (
              <SelectItem key={s.section_id ?? s.id} value={String(s.section_id ?? s.id)}>
                {s.class_name ?? ""} {s.section_name ?? s.name ?? "Section"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSectionId ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to view report cards</p>
          <p className="text-xs text-gray-400 mt-1">Choose one of your sections from the dropdown above</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-44">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                    No students found in this section
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {students.map((student: any, idx: number) => {
                    const studentId = String(student.student_id ?? student.id ?? idx);
                    const studentName = student.full_name ?? student.name ??
                      (`${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Student");
                    const rollNo = student.roll_number ?? student.roll_no ?? "\u2014";
                    const rcStatus = (student.report_card_status ?? student.rc_status ?? "not_generated").toLowerCase();
                    const reportCardId = String(student.report_card_id ?? student.rc_id ?? "");
                    const hasReportCard = rcStatus !== "not_generated" && reportCardId;

                    return (
                      <motion.tr
                        key={studentId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b last:border-b-0"
                      >
                        <TableCell className="text-gray-500 text-sm tabular-nums">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">{rollNo}</TableCell>
                        <TableCell className="font-medium text-sm">{studentName}</TableCell>
                        <TableCell><RCStatusBadge status={rcStatus} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {hasReportCard && (
                              <>
                                <PdfViewerDialog reportCardId={reportCardId} studentName={studentName} />
                                <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(reportCardId)}>
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  PDF
                                </Button>
                              </>
                            )}
                            {!hasReportCard && (
                              <span className="text-xs text-gray-400">Not generated yet</span>
                            )}
                          </div>
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

export default function TeacherGradebookPage() {
  const { data: teacher } = useTeacherProfile();
  const teacherId = teacher?.id;
  const myClasses = useMyClasses(teacherId);
  const mySubjects = useMySubjects(teacherId);

  const mySubjectIds = useMemo(
    () => new Set<string>(mySubjects.map((s: any) => String(s.subject_id ?? s.id ?? ""))),
    [mySubjects]
  );

  const sections = useMemo(() => {
    return myClasses.map((c: any) => ({
      section_id: c.section_id ?? c.id,
      class_name: c.class_name ?? c.className ?? "",
      section_name: c.section_name ?? c.sectionName ?? "",
    }));
  }, [myClasses]);

  const sectionIds = useMemo(
    () => sections.map((s: any) => String(s.section_id)),
    [sections]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner />

      <Tabs defaultValue="marks-entry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marks-entry">Marks Entry</TabsTrigger>
          <TabsTrigger value="internal-marks">Internal Marks</TabsTrigger>
          <TabsTrigger value="grade-scales">Grade Scales</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="marks-entry">
            <motion.div key="marks-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <MarksEntryTab sectionIds={sectionIds} mySubjectIds={mySubjectIds} />
            </motion.div>
          </TabsContent>

          <TabsContent value="internal-marks">
            <motion.div key="internal-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <InternalMarksTab sections={sections} />
            </motion.div>
          </TabsContent>

          <TabsContent value="grade-scales">
            <motion.div key="scales-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <GradeScalesTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="report-cards">
            <motion.div key="rc-tab" variants={tabFade} initial="initial" animate="animate" exit="exit">
              <ReportCardsTab sections={sections} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
