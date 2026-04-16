"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYears, useClasses, useSections } from "@/hooks/use-academic";
import {
  useSectionStudents,
  useMarkAttendance,
  useAttendanceReport,
} from "@/hooks/use-attendance";

// ── helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

const STATUS_CONFIG: {
  key: AttendanceStatus;
  label: string;
  active: string;
}[] = [
  { key: "present", label: "P", active: "bg-green-500 text-white" },
  { key: "absent", label: "A", active: "bg-red-500 text-white" },
  { key: "late", label: "L", active: "bg-yellow-500 text-white" },
  { key: "half_day", label: "HD", active: "bg-orange-500 text-white" },
];

const INACTIVE = "bg-gray-100 text-gray-600 hover:bg-gray-200";

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function rowColor(attendancePct: number): string {
  if (attendancePct >= 90) return "bg-green-50";
  if (attendancePct >= 75) return "bg-yellow-50";
  return "bg-red-50";
}

// ── Mark Attendance Tab ──────────────────────────────────────────────────────

function MarkAttendanceTab() {
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  // data hooks
  const { data: yearsData } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  const { data: classesData, isLoading: classesLoading } = useClasses(selectedYearId || undefined);
  const classes: any[] = Array.isArray(classesData)
    ? classesData
    : (classesData as any)?.items ?? (classesData as any)?.classes ?? [];

  const { data: sectionsData, isLoading: sectionsLoading } = useSections(
    selectedClassId || undefined
  );
  const sections: any[] = Array.isArray(sectionsData)
    ? sectionsData
    : (sectionsData as any)?.items ?? (sectionsData as any)?.sections ?? [];

  const { data: studentsData, isLoading: studentsLoading } = useSectionStudents(
    selectedSection || undefined
  );
  const students: any[] = Array.isArray(studentsData)
    ? studentsData
    : (studentsData as any)?.items ?? (studentsData as any)?.students ?? [];

  const markMutation = useMarkAttendance();

  // auto-select current year
  useEffect(() => {
    if (!selectedYearId && years.length > 0) {
      const current = years.find((y: any) => y.is_current);
      const id = String(
        (current ?? years[0])?.academic_year_id ?? (current ?? years[0])?.id ?? ""
      );
      if (id) setSelectedYearId(id);
    }
  }, [years, selectedYearId]);

  // default all students to present when student list loads / changes
  useEffect(() => {
    if (students.length === 0) return;
    setAttendanceMap((prev) => {
      const next: Record<string, AttendanceStatus> = { ...prev };
      students.forEach((s: any) => {
        const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
        if (id && !next[id]) next[id] = "present";
      });
      return next;
    });
  }, [students]);

  // reset map when section changes
  useEffect(() => {
    setAttendanceMap({});
  }, [selectedSection]);

  const handleStatusToggle = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    },
    []
  );

  const handleSubmit = () => {
    if (!selectedSection || !selectedDate || !selectedYearId) return;
    markMutation.mutate({
      section_id: selectedSection,
      date: selectedDate,
      academic_year_id: selectedYearId,
      records: students.map((s: any) => {
        const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
        return { student_id: id, status: attendanceMap[id] ?? "present" };
      }),
    });
  };

  const showGrid = !!selectedSection && !!selectedDate;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4">
        {/* Academic Year (auto-selected, shown as reference) */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Academic Year
          </Label>
          <Select
            value={selectedYearId}
            onValueChange={(val) => {
              setSelectedYearId(val ?? "");
              setSelectedClassId("");
              setSelectedSection("");
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y: any) => (
                <SelectItem
                  key={y.academic_year_id ?? y.id}
                  value={String(y.academic_year_id ?? y.id)}
                >
                  {y.label ?? y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</Label>
          <Select
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val ?? "");
              setSelectedSection("");
            }}
            disabled={!selectedYearId || classesLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem
                  key={c.class_id ?? c.id}
                  value={String(c.class_id ?? c.id)}
                >
                  {c.class_name ?? c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Section
          </Label>
          <Select
            value={selectedSection}
            onValueChange={(val) => setSelectedSection(val ?? "")}
            disabled={!selectedClassId || sectionsLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec: any) => (
                <SelectItem
                  key={sec.section_id ?? sec.id}
                  value={String(sec.section_id ?? sec.id)}
                >
                  {sec.section_name ?? sec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="font-medium">Status keys:</span>
        {STATUS_CONFIG.map((s) => (
          <span
            key={s.key}
            className={`inline-flex h-6 w-8 items-center justify-center rounded font-bold ${s.active}`}
          >
            {s.label}
          </span>
        ))}
        <span>= Present / Absent / Late / Half Day</span>
      </div>

      {/* Grid */}
      {!showGrid ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          Select a class, section, and date to mark attendance
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-48">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {Array.from({ length: 4 }).map((__, j) => (
                            <Skeleton key={j} className="h-8 w-10 rounded" />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : students.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-gray-400">
                        No students found for this section
                      </TableCell>
                    </TableRow>
                  )
                : students.map((s: any, idx: number) => {
                    const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
                    const name =
                      s.full_name ??
                      s.name ??
                      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() ??
                      s.data?.full_name ??
                      "—";
                    const rollNo =
                      s.roll_number ?? s.admission_number ?? s.data?.roll_number ?? idx + 1;
                    const currentStatus: AttendanceStatus = attendanceMap[id] ?? "present";

                    return (
                      <TableRow key={id || idx} className="hover:bg-gray-50">
                        <TableCell className="text-center text-sm text-gray-500 font-mono">
                          {rollNo}
                        </TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {STATUS_CONFIG.map((cfg) => (
                              <button
                                key={cfg.key}
                                type="button"
                                onClick={() => handleStatusToggle(id, cfg.key)}
                                className={`h-8 w-10 rounded text-xs font-bold transition-colors ${
                                  currentStatus === cfg.key ? cfg.active : INACTIVE
                                }`}
                              >
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {/* Summary + Submit */}
          {!studentsLoading && students.length > 0 && (
            <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
              <div className="flex gap-4 text-sm text-gray-600">
                {STATUS_CONFIG.map((cfg) => {
                  const count = students.filter((s: any) => {
                    const id = String(s.id ?? s.student_id ?? s.data?.id ?? "");
                    return (attendanceMap[id] ?? "present") === cfg.key;
                  }).length;
                  return (
                    <span key={cfg.key}>
                      <span className={`inline-flex h-5 w-7 items-center justify-center rounded text-xs font-bold ${cfg.active} mr-1`}>
                        {cfg.label}
                      </span>
                      {count}
                    </span>
                  );
                })}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={markMutation.isPending || students.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {markMutation.isPending ? "Submitting..." : "Submit Attendance"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const { data: yearsData } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  const { data: classesData, isLoading: classesLoading } = useClasses(selectedYearId || undefined);
  const classes: any[] = Array.isArray(classesData)
    ? classesData
    : (classesData as any)?.items ?? (classesData as any)?.classes ?? [];

  const { data: sectionsData, isLoading: sectionsLoading } = useSections(
    selectedClassId || undefined
  );
  const sections: any[] = Array.isArray(sectionsData)
    ? sectionsData
    : (sectionsData as any)?.items ?? (sectionsData as any)?.sections ?? [];

  const { data: reportData, isLoading: reportLoading } = useAttendanceReport(
    selectedSection || undefined,
    selectedYearId || undefined
  );
  const records: any[] = Array.isArray(reportData)
    ? reportData
    : (reportData as any)?.items ?? (reportData as any)?.students ?? [];

  // auto-select current year
  useEffect(() => {
    if (!selectedYearId && years.length > 0) {
      const current = years.find((y: any) => y.is_current);
      const id = String(
        (current ?? years[0])?.academic_year_id ?? (current ?? years[0])?.id ?? ""
      );
      if (id) setSelectedYearId(id);
    }
  }, [years, selectedYearId]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Academic Year
          </Label>
          <Select
            value={selectedYearId}
            onValueChange={(val) => {
              setSelectedYearId(val ?? "");
              setSelectedClassId("");
              setSelectedSection("");
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y: any) => (
                <SelectItem
                  key={y.academic_year_id ?? y.id}
                  value={String(y.academic_year_id ?? y.id)}
                >
                  {y.label ?? y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</Label>
          <Select
            value={selectedClassId}
            onValueChange={(val) => {
              setSelectedClassId(val ?? "");
              setSelectedSection("");
            }}
            disabled={!selectedYearId || classesLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem
                  key={c.class_id ?? c.id}
                  value={String(c.class_id ?? c.id)}
                >
                  {c.class_name ?? c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Section
          </Label>
          <Select
            value={selectedSection}
            onValueChange={(val) => setSelectedSection(val ?? "")}
            disabled={!selectedClassId || sectionsLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec: any) => (
                <SelectItem
                  key={sec.section_id ?? sec.id}
                  value={String(sec.section_id ?? sec.id)}
                >
                  {sec.section_name ?? sec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Color key */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Row color:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-200" />
          &ge;90% (Good)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-yellow-200" />
          75–90% (Average)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-200" />
          &lt;75% (Low)
        </span>
      </div>

      {/* Table */}
      {!selectedSection || !selectedYearId ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          Select a class, section, and academic year to view the report
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Total Days</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Half Day</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                : records.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                        No attendance data found for this selection
                      </TableCell>
                    </TableRow>
                  )
                : records.map((r: any, idx: number) => {
                    const name =
                      r.full_name ??
                      r.name ??
                      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() ??
                      "—";
                    const totalDays: number = r.total_days ?? r.total ?? 0;
                    const present: number = r.present ?? r.present_count ?? 0;
                    const absent: number = r.absent ?? r.absent_count ?? 0;
                    const late: number = r.late ?? r.late_count ?? 0;
                    const halfDay: number = r.half_day ?? r.half_day_count ?? 0;
                    const attendancePct: number =
                      r.attendance_percentage ??
                      r.percentage ??
                      (totalDays > 0 ? (present / totalDays) * 100 : 0);

                    return (
                      <TableRow
                        key={r.student_id ?? r.id ?? idx}
                        className={rowColor(attendancePct)}
                      >
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-center text-gray-600">{totalDays}</TableCell>
                        <TableCell className="text-center font-semibold text-green-700">
                          {present}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-red-600">
                          {absent}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-yellow-600">
                          {late}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-orange-600">
                          {halfDay}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                              attendancePct >= 90
                                ? "bg-green-100 text-green-700"
                                : attendancePct >= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pct(attendancePct)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance and view attendance reports"
      />
      <Tabs defaultValue="mark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="mark">
          <MarkAttendanceTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
