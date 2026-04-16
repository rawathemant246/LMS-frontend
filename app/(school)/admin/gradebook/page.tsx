"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
  Plus,
  Save,
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Send,
  Sparkles,
  X,
  BookOpen,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useExams, useExam, useExamResults, useBulkMarks } from "@/hooks/use-exams";
import { useAcademicYears, useClasses, useSections } from "@/hooks/use-academic";
import { useStudents } from "@/hooks/use-students";
import {
  useGradeScales,
  useCreateGradeScale,
  useGenerateReportCards,
  usePublishReportCards,
  useReportCardPdf,
} from "@/hooks/use-gradebook";

// -- Helpers ----------------------------------------------------------------

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

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

// -- Animation variants -----------------------------------------------------

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
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

const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

// -- Report Card Status Badge -----------------------------------------------

const RC_STATUS_COLORS: Record<string, string> = {
  not_generated: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  generated: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  published: "bg-green-100 text-green-700 hover:bg-green-100",
};

function RCStatusBadge({ status }: { status: string }) {
  const cls =
    RC_STATUS_COLORS[status?.toLowerCase()] ??
    "bg-gray-100 text-gray-600 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cls}`}>
      {status?.replace(/_/g, " ") || "Not Generated"}
    </Badge>
  );
}

// -- Scale type badge -------------------------------------------------------

const SCALE_TYPE_COLORS: Record<string, string> = {
  percentage: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  grade_point: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  marks: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

// == TAB 1 -- Marks Entry ===================================================

function MarksEntryTab() {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
  const [savedCells, setSavedCells] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const { data: examsData } = useExams();
  const exams = extractArray(examsData);

  const { data: academicYearsData } = useAcademicYears();
  const academicYears = extractArray(academicYearsData);
  const currentYearId = academicYears.length > 0 ? String(academicYears[0].academic_year_id ?? academicYears[0].id ?? "") : undefined;

  const { data: classesData } = useClasses(currentYearId);
  const classes = extractArray(classesData);

  const { data: sectionsData } = useSections(selectedClassId || undefined);
  const sections = extractArray(sectionsData);

  const { data: examData } = useExam(selectedExamId || undefined);
  const { data: resultsData, isLoading: resultsLoading } = useExamResults(selectedExamId || undefined);
  const results = extractArray(resultsData);

  const { data: gradeScalesData } = useGradeScales();
  const gradeScales = extractArray(gradeScalesData);
  const defaultScale = gradeScales[0];
  const scaleEntries = extractArray(defaultScale?.entries ?? defaultScale?.grade_entries ?? []);

  const bulkMarksMutation = useBulkMarks();

  // Extract paper sections from exam data
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
    // If no sections found, create a single column from exam total
    if (allSections.length === 0 && exam) {
      const totalMarks = Number(exam.total_marks ?? exam.data?.total_marks ?? 100);
      allSections.push({
        id: "total",
        label: "Total",
        max_marks: totalMarks,
        paper_name: "",
      });
    }
    return allSections;
  }, [examData]);

  const maxTotal = useMemo(
    () => paperSections.reduce((sum, s) => sum + s.max_marks, 0),
    [paperSections]
  );

  // Filter results by section if selected
  const filteredResults = useMemo(() => {
    if (!selectedSectionId) return results;
    return results.filter(
      (r: any) =>
        String(r.section_id ?? r.student?.section_id ?? "") === selectedSectionId
    );
  }, [results, selectedSectionId]);

  // Sort by roll number
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a: any, b: any) => {
      const ra = Number(a.roll_number ?? a.roll_no ?? a.student?.roll_number ?? 0);
      const rb = Number(b.roll_number ?? b.roll_no ?? b.student?.roll_number ?? 0);
      return ra - rb;
    });
  }, [filteredResults]);

  // Initialize marks from results data
  const getStudentMark = useCallback(
    (studentId: string, sectionId: string): number => {
      if (marks[studentId]?.[sectionId] !== undefined) return marks[studentId][sectionId];
      const result = results.find(
        (r: any) => String(r.student_id ?? r.student?.id ?? "") === studentId
      );
      if (!result) return 0;
      const sectionMarks = extractArray(result.section_marks ?? result.marks_breakdown ?? []);
      const found = sectionMarks.find(
        (m: any) => String(m.exam_paper_section_id ?? m.section_id ?? m.id ?? "") === sectionId
      );
      if (found) return Number(found.marks_obtained ?? found.marks ?? found.score ?? 0);
      // Fallback: if single "total" section, use total marks
      if (sectionId === "total") return Number(result.total_marks ?? result.marks ?? result.total ?? 0);
      return 0;
    },
    [marks, results]
  );

  const handleMarkChange = (studentId: string, sectionId: string, value: number) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? {}),
        [sectionId]: value,
      },
    }));
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
        sectionMarks.push({
          exam_paper_section_id: sec.id,
          marks_obtained: getStudentMark(studentId, sec.id),
        });
      }
      entries.push({
        student_id: studentId,
        section_marks: sectionMarks,
        total_marks: getStudentTotal(studentId),
      });
    }
    bulkMarksMutation.mutate(
      { examId: selectedExamId, data: { marks: entries } },
      {
        onSuccess: () => {
          const allKeys = new Set<string>();
          for (const r of sortedResults) {
            const sid = String(r.student_id ?? r.student?.id ?? "");
            for (const sec of paperSections) {
              allKeys.add(`${sid}-${sec.id}`);
            }
          }
          setSavedCells(allKeys);
          setTimeout(() => setSavedCells(new Set()), 1200);
        },
      }
    );
  };

  // Tab/Enter navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    sectionIdx: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      // Move to next cell in same row, or first cell of next row
      const nextSec = sectionIdx + 1;
      if (nextSec < paperSections.length) {
        const key = `${studentIdx}-${nextSec}`;
        inputRefs.current.get(key)?.focus();
      } else if (studentIdx + 1 < sortedResults.length) {
        const key = `${studentIdx + 1}-0`;
        inputRefs.current.get(key)?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Move down in same column
      if (studentIdx + 1 < sortedResults.length) {
        const key = `${studentIdx + 1}-${sectionIdx}`;
        inputRefs.current.get(key)?.focus();
      }
    }
  };

  // Class average
  const classAverage = useMemo(() => {
    if (sortedResults.length === 0) return 0;
    const totals = sortedResults.map((r: any) => {
      const sid = String(r.student_id ?? r.student?.id ?? "");
      return getStudentTotal(sid);
    });
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }, [sortedResults, getStudentTotal, paperSections]);

  if (!selectedExamId) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={selectedExamId} onValueChange={(val) => { setSelectedExamId(val ?? ""); setMarks({}); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((e: any) => (
                <SelectItem key={e.exam_id ?? e.id} value={String(e.exam_id ?? e.id)}>
                  {e.name ?? e.title ?? "Exam"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select an exam to enter marks</p>
          <p className="text-xs text-gray-400 mt-1">Choose an exam, class, and section from the filters above</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={selectedExamId} onValueChange={(val) => { setSelectedExamId(val ?? ""); setMarks({}); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select Exam" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((e: any) => (
              <SelectItem key={e.exam_id ?? e.id} value={String(e.exam_id ?? e.id)}>
                {e.name ?? e.title ?? "Exam"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val ?? ""); setSelectedSectionId(""); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls: any) => (
              <SelectItem key={cls.class_id ?? cls.id} value={String(cls.class_id ?? cls.id)}>
                {cls.class_name ?? cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSectionId} onValueChange={(val) => setSelectedSectionId(val ?? "")} disabled={!selectedClassId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((sec: any) => (
              <SelectItem key={sec.section_id ?? sec.id} value={String(sec.section_id ?? sec.id)}>
                {sec.section_name ?? sec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button onClick={handleSaveAll} disabled={bulkMarksMutation.isPending || sortedResults.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {bulkMarksMutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {/* Marks grid */}
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
                      <TableCell className="text-gray-500 text-sm tabular-nums sticky left-0 bg-inherit z-10">
                        {studentIdx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500 sticky left-10 bg-inherit z-10">
                        {r.roll_number ?? r.roll_no ?? r.student?.roll_number ?? "\u2014"}
                      </TableCell>
                      <TableCell className="font-medium text-sm sticky left-28 bg-inherit z-10">
                        {r.student_name ??
                          r.student?.name ??
                          r.student?.full_name ??
                          (`${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.trim() || "Student")}
                      </TableCell>
                      {paperSections.map((sec, sectionIdx) => {
                        const val = getStudentMark(studentId, sec.id);
                        const isOver = val > sec.max_marks;
                        const cellKey = `${studentId}-${sec.id}`;
                        const isSaved = savedCells.has(cellKey);

                        return (
                          <TableCell key={sec.id} className="text-center px-1">
                            <input
                              ref={(el) => {
                                if (el) inputRefs.current.set(`${studentIdx}-${sectionIdx}`, el);
                              }}
                              type="number"
                              min={0}
                              max={sec.max_marks}
                              value={val}
                              onChange={(e) =>
                                handleMarkChange(studentId, sec.id, Number(e.target.value) || 0)
                              }
                              onKeyDown={(e) => handleKeyDown(e, studentIdx, sectionIdx)}
                              className={`w-16 h-8 text-center text-sm tabular-nums rounded-md border px-1 outline-none transition-colors focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                                isOver ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200"
                              } ${isSaved ? "bg-green-100" : ""}`}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center tabular-nums text-sm font-semibold">
                        {total}/{maxTotal}
                      </TableCell>
                      <TableCell className="text-center">
                        <motion.div
                          key={grade}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge
                            variant="outline"
                            className={`border-transparent ${getGradeColor(grade)}`}
                          >
                            {grade}
                          </Badge>
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
                <TableCell colSpan={3} className="text-right text-sm text-gray-600 sticky left-0 bg-gray-50 z-10">
                  Class Average
                </TableCell>
                {paperSections.map((sec) => {
                  const avg =
                    sortedResults.length > 0
                      ? sortedResults.reduce((sum: number, r: any) => {
                          const sid = String(r.student_id ?? r.student?.id ?? "");
                          return sum + getStudentMark(sid, sec.id);
                        }, 0) / sortedResults.length
                      : 0;
                  return (
                    <TableCell key={sec.id} className="text-center text-sm tabular-nums text-gray-600">
                      {avg.toFixed(1)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center text-sm tabular-nums font-semibold text-gray-700">
                  {classAverage.toFixed(1)}/{maxTotal}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// == TAB 2 -- Grade Scales ==================================================

function CreateGradeScaleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scaleType, setScaleType] = useState("");
  const [entries, setEntries] = useState<
    { grade_label: string; min_percentage: string; max_percentage: string; grade_point: string; description: string; sort_order: number }[]
  >([{ grade_label: "", min_percentage: "", max_percentage: "", grade_point: "", description: "", sort_order: 1 }]);

  const mutation = useCreateGradeScale();

  const reset = () => {
    setName("");
    setScaleType("");
    setEntries([{ grade_label: "", min_percentage: "", max_percentage: "", grade_point: "", description: "", sort_order: 1 }]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { grade_label: "", min_percentage: "", max_percentage: "", grade_point: "", description: "", sort_order: prev.length + 1 },
    ]);
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: string, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        name,
        scale_type: scaleType,
        entries: entries.map((en) => ({
          grade_label: en.grade_label,
          min_percentage: Number(en.min_percentage),
          max_percentage: Number(en.max_percentage),
          grade_point: Number(en.grade_point) || 0,
          description: en.description || undefined,
          sort_order: en.sort_order,
        })),
      },
      { onSuccess: () => { setOpen(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Grade Scale
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Grade Scale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="scale-name">Scale Name</Label>
            <Input
              id="scale-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CBSE 9-Point Grading"
              required
            />
          </div>
          <div>
            <Label>Scale Type</Label>
            <Select value={scaleType} onValueChange={(val) => setScaleType(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="grade_point">Grade Point</SelectItem>
                <SelectItem value="marks">Marks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade Entries</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Entry
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border p-3 bg-gray-50/50">
              {entries.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                  <Input
                    className="col-span-2 h-8 text-xs"
                    placeholder="Grade"
                    value={entry.grade_label}
                    onChange={(e) => updateEntry(idx, "grade_label", e.target.value)}
                    required
                  />
                  <Input
                    className="col-span-2 h-8 text-xs"
                    type="number"
                    placeholder="Min%"
                    value={entry.min_percentage}
                    onChange={(e) => updateEntry(idx, "min_percentage", e.target.value)}
                    required
                  />
                  <Input
                    className="col-span-2 h-8 text-xs"
                    type="number"
                    placeholder="Max%"
                    value={entry.max_percentage}
                    onChange={(e) => updateEntry(idx, "max_percentage", e.target.value)}
                    required
                  />
                  <Input
                    className="col-span-2 h-8 text-xs"
                    type="number"
                    step="0.1"
                    placeholder="GP"
                    value={entry.grade_point}
                    onChange={(e) => updateEntry(idx, "grade_point", e.target.value)}
                  />
                  <Input
                    className="col-span-3 h-8 text-xs"
                    placeholder="Description"
                    value={entry.description}
                    onChange={(e) => updateEntry(idx, "description", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="col-span-1 flex items-center justify-center h-8 w-8 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={entries.length <= 1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || !name || !scaleType}>
            {mutation.isPending ? "Creating..." : "Create Grade Scale"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
      <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
        <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No grade scales yet</p>
        <p className="text-xs text-gray-400 mt-1">Create your first grade scale using the button above</p>
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
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : scaleId)}
                  className="flex items-center justify-between w-full p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{scale.name ?? "Unnamed Scale"}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{entries.length} grade entries</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`border-transparent capitalize ${typeCls}`}>
                    {scaleTypeLower.replace(/_/g, " ")}
                  </Badge>
                </button>

                {/* Expanded body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      variants={expandCollapse}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="overflow-hidden"
                    >
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
                                  <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                                    No entries defined
                                  </TableCell>
                                </TableRow>
                              ) : (
                                entries
                                  .sort((a: any, b: any) => (b.max_percentage ?? 0) - (a.max_percentage ?? 0))
                                  .map((entry: any, idx: number) => (
                                    <TableRow key={entry.id ?? idx}>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={`border-transparent ${getGradeColor(entry.grade_label ?? "")}`}
                                        >
                                          {entry.grade_label ?? "\u2014"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.min_percentage ?? 0}%</TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.max_percentage ?? 0}%</TableCell>
                                      <TableCell className="tabular-nums text-sm">{entry.grade_point ?? "\u2014"}</TableCell>
                                      <TableCell className="text-sm text-gray-500">{entry.description ?? "\u2014"}</TableCell>
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

// == TAB 3 -- Report Cards ==================================================

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
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Download instead
                </a>
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

function ReportCardsTab() {
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const { data: academicYearsData } = useAcademicYears();
  const academicYears = extractArray(academicYearsData);

  const { data: classesData } = useClasses(selectedYearId || undefined);
  const classes = extractArray(classesData);

  const { data: sectionsData } = useSections(selectedClassId || undefined);
  const sections = extractArray(sectionsData);

  const { data: studentsData, isLoading: studentsLoading } = useStudents(
    selectedClassId || undefined,
    selectedSectionId || undefined
  );
  const students = extractArray(studentsData);

  const generateMutation = useGenerateReportCards();
  const publishMutation = usePublishReportCards();

  const handleGenerate = () => {
    if (!selectedSectionId || !selectedYearId) return;
    generateMutation.mutate({
      section_id: selectedSectionId,
      academic_year_id: selectedYearId,
    });
  };

  const handlePublish = () => {
    if (!selectedSectionId) return;
    publishMutation.mutate({ section_id: selectedSectionId });
  };

  const handleDownloadPdf = async (reportCardId: string) => {
    try {
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/report-cards/${reportCardId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      // handled by mutation toast
    }
  };

  return (
    <div>
      {/* Cascade selector */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Select value={selectedYearId} onValueChange={(val) => { setSelectedYearId(val ?? ""); setSelectedClassId(""); setSelectedSectionId(""); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y: any) => (
              <SelectItem key={y.academic_year_id ?? y.id} value={String(y.academic_year_id ?? y.id)}>
                {y.year_name ?? y.name ?? y.label ?? "Year"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val ?? ""); setSelectedSectionId(""); }} disabled={!selectedYearId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls: any) => (
              <SelectItem key={cls.class_id ?? cls.id} value={String(cls.class_id ?? cls.id)}>
                {cls.class_name ?? cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSectionId} onValueChange={(val) => setSelectedSectionId(val ?? "")} disabled={!selectedClassId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((sec: any) => (
              <SelectItem key={sec.section_id ?? sec.id} value={String(sec.section_id ?? sec.id)}>
                {sec.section_name ?? sec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSectionId && (
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? "Generating..." : "Generate All"}
            </Button>
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish All"}
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedSectionId ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select a section to manage report cards</p>
          <p className="text-xs text-gray-400 mt-1">Choose academic year, class, and section from the filters above</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
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
                        <TableCell>
                          <RCStatusBadge status={rcStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {hasReportCard && (
                              <>
                                <PdfViewerDialog reportCardId={reportCardId} studentName={studentName} />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPdf(reportCardId)}
                                >
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

// == Page ===================================================================

export default function GradebookPage() {
  return (
    <div>
      <PageHeader
        title="Gradebook"
        description="Manage marks, grade scales, and report cards"
      >
        <CreateGradeScaleDialog />
      </PageHeader>

      <Tabs defaultValue="marks-entry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marks-entry">Marks Entry</TabsTrigger>
          <TabsTrigger value="grade-scales">Grade Scales</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="marks-entry">
            <motion.div
              key="marks-entry-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <MarksEntryTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="grade-scales">
            <motion.div
              key="grade-scales-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GradeScalesTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="report-cards">
            <motion.div
              key="report-cards-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ReportCardsTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
