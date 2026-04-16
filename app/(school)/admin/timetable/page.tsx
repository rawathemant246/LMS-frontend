"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Clock, Coffee, Utensils, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  usePeriodDefinitions,
  useCreatePeriod,
  useSectionTimetable,
  useCreateSlot,
} from "@/hooks/use-timetable";
import {
  useAcademicYears,
  useClasses,
  useSections,
  useSubjects,
} from "@/hooks/use-academic";
import { useSchoolTeachers } from "@/hooks/use-school";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_COLORS = [
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_ICON: Record<string, React.ReactNode> = {
  class: <Clock className="h-3.5 w-3.5" />,
  break: <Coffee className="h-3.5 w-3.5" />,
  lunch: <Utensils className="h-3.5 w-3.5" />,
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  class: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  break: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  lunch: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

// ── Animation variants ────────────────────────────────────────────────────────

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const gridFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  if (!time) return "";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${suffix}`;
  } catch {
    return time;
  }
}

function getSubjectColor(subjectId: string, subjectIds: string[]) {
  const idx = subjectIds.indexOf(subjectId);
  return SUBJECT_COLORS[idx >= 0 ? idx % SUBJECT_COLORS.length : 0];
}

// ── Add Period Dialog ─────────────────────────────────────────────────────────

function AddPeriodDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({
    label: "",
    start_time: "",
    end_time: "",
    period_type: "class",
  });

  const mutation = useCreatePeriod();

  const reset = () =>
    setForm({ label: "", start_time: "", end_time: "", period_type: "class" });

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle>Add Period</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div>
              <Label htmlFor="period-label">Label</Label>
              <Input
                id="period-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Period 1, Lunch Break"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="period-start">Start Time</Label>
                <Input
                  id="period-start"
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_time: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="period-end">End Time</Label>
                <Input
                  id="period-end"
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_time: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.period_type}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, period_type: val ?? "class" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Add Period"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Slot Dialog ────────────────────────────────────────────────────────

function AssignSlotDialog({
  open,
  onOpenChange,
  cell,
  sectionId,
  existingSlot,
  subjects,
  teachers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { day: string; periodId: string } | null;
  sectionId: string;
  existingSlot: any | null;
  subjects: any[];
  teachers: any[];
}) {
  const [form, setForm] = useState({ subject_id: "", teacher_user_id: "" });
  const mutation = useCreateSlot();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) setForm({ subject_id: "", teacher_user_id: "" });
  };

  // pre-fill when editing existing slot
  const handleOpen = () => {
    if (existingSlot) {
      setForm({
        subject_id: String(existingSlot.subject_id ?? existingSlot.subject?.id ?? ""),
        teacher_user_id: String(
          existingSlot.teacher_user_id ?? existingSlot.teacher?.user_id ?? existingSlot.teacher?.id ?? ""
        ),
      });
    }
  };

  // trigger pre-fill when cell changes and dialog opens
  if (open && cell && existingSlot && !form.subject_id) {
    handleOpen();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cell) return;
    mutation.mutate(
      {
        section_id: sectionId,
        period_definition_id: cell.periodId,
        day_of_week: cell.day,
        subject_id: form.subject_id,
        teacher_user_id: form.teacher_user_id,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  const handleClear = () => {
    if (!cell) return;
    mutation.mutate(
      {
        section_id: sectionId,
        period_definition_id: cell.periodId,
        day_of_week: cell.day,
        subject_id: null,
        teacher_user_id: null,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  const dayLabel = cell ? DAY_LABELS[DAYS.indexOf(cell.day)] ?? cell.day : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle>
              {existingSlot ? "Edit Slot" : "Assign Slot"} &mdash; {dayLabel}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
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
            <div>
              <Label>Teacher</Label>
              <Select
                value={form.teacher_user_id}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, teacher_user_id: val ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => (
                    <SelectItem
                      key={t.user_id ?? t.id}
                      value={String(t.user_id ?? t.id)}
                    >
                      {t.full_name ??
                        t.name ??
                        `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() ??
                        "Teacher"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending || !form.subject_id}
              >
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
              {existingSlot && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleClear}
                  disabled={mutation.isPending}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ── Period List (Left Panel) ──────────────────────────────────────────────────

function PeriodList({
  periods,
  isLoading,
  onAddClick,
}: {
  periods: any[];
  isLoading: boolean;
  onAddClick: () => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {periods.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No periods defined yet
          </div>
        ) : (
          <motion.div
            className="space-y-1"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {periods.map((period: any) => {
              const pType = period.period_type ?? "class";
              const isBreakType = pType === "break" || pType === "lunch";
              return (
                <motion.div
                  key={period.period_definition_id ?? period.id}
                  variants={staggerItem}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isBreakType
                      ? "bg-amber-50/80"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      pType === "class"
                        ? "bg-blue-100 text-blue-600"
                        : pType === "lunch"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {TYPE_ICON[pType] ?? <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {period.label ?? period.name ?? "Period"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(period.start_time)} &ndash;{" "}
                      {formatTime(period.end_time)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-transparent capitalize text-xs ${
                      TYPE_BADGE_STYLES[pType] ?? TYPE_BADGE_STYLES.class
                    }`}
                  >
                    {pType}
                  </Badge>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Period
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Weekly Grid (Right Panel) ─────────────────────────────────────────────────

function WeeklyGrid({
  periods,
  slots,
  isLoading,
  subjects,
  subjectIds,
  teachers,
  onCellClick,
}: {
  periods: any[];
  slots: any[];
  isLoading: boolean;
  subjects: any[];
  subjectIds: string[];
  teachers: any[];
  onCellClick: (day: string, periodId: string, existingSlot: any | null) => void;
}) {
  // Build a lookup: `${periodId}-${day}` -> slot
  const slotMap = useMemo(() => {
    const map: Record<string, any> = {};
    slots.forEach((slot: any) => {
      const pId = String(
        slot.period_definition_id ?? slot.period_id ?? ""
      );
      const day = slot.day_of_week ?? slot.day ?? "";
      if (pId && day) map[`${pId}-${day}`] = slot;
    });
    return map;
  }, [slots]);

  // Subject name lookup
  const subjectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s: any) => {
      const id = String(s.subject_id ?? s.id ?? "");
      map[id] = s.subject_name ?? s.name ?? "Subject";
    });
    return map;
  }, [subjects]);

  // Teacher name lookup
  const teacherNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t: any) => {
      const id = String(t.user_id ?? t.id ?? "");
      map[id] =
        t.full_name ??
        t.name ??
        `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() ??
        "Teacher";
    });
    return map;
  }, [teachers]);

  const classPeriods = periods.filter(
    (p: any) => (p.period_type ?? "class") === "class"
  );
  const allPeriods = periods;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                  Period
                </th>
                {DAY_LABELS.map((label) => (
                  <th
                    key={label}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {DAY_LABELS.map((_, j) => (
                    <td key={j} className="px-2 py-3">
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (allPeriods.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No periods defined</p>
        <p className="text-xs text-gray-400 mt-1">
          Add periods in the left panel to build your timetable grid
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                Period
              </th>
              {DAY_LABELS.map((label) => (
                <th
                  key={label}
                  className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPeriods.map((period: any) => {
              const pId = String(period.period_definition_id ?? period.id ?? "");
              const pType = period.period_type ?? "class";
              const isBreakType = pType === "break" || pType === "lunch";

              if (isBreakType) {
                return (
                  <tr key={pId} className="border-b last:border-b-0">
                    <td
                      colSpan={7}
                      className="px-3 py-2"
                    >
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2">
                        {pType === "lunch" ? (
                          <Utensils className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <Coffee className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className="text-sm font-medium text-amber-700">
                          {period.label ?? period.name ?? "Break"}
                        </span>
                        <span className="text-xs text-amber-500 ml-1">
                          {formatTime(period.start_time)} &ndash;{" "}
                          {formatTime(period.end_time)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={pId} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {period.label ?? period.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(period.start_time)} &ndash;{" "}
                        {formatTime(period.end_time)}
                      </p>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotMap[`${pId}-${day}`];
                    const subjectId = String(
                      slot?.subject_id ?? slot?.subject?.id ?? ""
                    );
                    const teacherId = String(
                      slot?.teacher_user_id ??
                        slot?.teacher?.user_id ??
                        slot?.teacher?.id ??
                        ""
                    );
                    const subjectName = subjectId
                      ? subjectNameMap[subjectId] ?? "Subject"
                      : "";
                    const teacherName = teacherId
                      ? teacherNameMap[teacherId] ?? ""
                      : "";
                    const isFilled = !!slot && !!subjectId;

                    if (isFilled) {
                      const color = getSubjectColor(subjectId, subjectIds);
                      return (
                        <td key={day} className="px-1.5 py-1.5">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            onClick={() => onCellClick(day, pId, slot)}
                            className={`w-full rounded-lg border px-2 py-2 text-left transition-shadow hover:shadow-sm ${color.bg} ${color.border} cursor-pointer`}
                          >
                            <p className={`text-xs font-semibold ${color.text} truncate`}>
                              {subjectName}
                            </p>
                            {teacherName && (
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                {teacherName}
                              </p>
                            )}
                          </motion.button>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="px-1.5 py-1.5">
                        <button
                          type="button"
                          onClick={() => onCellClick(day, pId, null)}
                          className="w-full rounded-lg border-2 border-dashed border-gray-200 px-2 py-3 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 mx-auto text-gray-300" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAssignSlot, setShowAssignSlot] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    periodId: string;
  } | null>(null);
  const [existingSlotForEdit, setExistingSlotForEdit] = useState<any | null>(
    null
  );

  // Data hooks
  const { data: periodsRaw, isLoading: periodsLoading } =
    usePeriodDefinitions();
  const periods: any[] = Array.isArray(periodsRaw)
    ? periodsRaw
    : (periodsRaw as any)?.data?.items ??
      (periodsRaw as any)?.data ??
      (periodsRaw as any)?.items ??
      (periodsRaw as any)?.period_definitions ??
      [];

  const { data: yearsData } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  const { data: classesData, isLoading: classesLoading } = useClasses(
    selectedYearId || undefined
  );
  const classes: any[] = Array.isArray(classesData)
    ? classesData
    : (classesData as any)?.items ?? (classesData as any)?.classes ?? [];

  const { data: sectionsData, isLoading: sectionsLoading } = useSections(
    selectedClassId || undefined
  );
  const sections: any[] = Array.isArray(sectionsData)
    ? sectionsData
    : (sectionsData as any)?.items ?? (sectionsData as any)?.sections ?? [];

  const { data: timetableRaw, isLoading: timetableLoading } =
    useSectionTimetable(selectedSectionId || undefined);
  const slots: any[] = Array.isArray(timetableRaw)
    ? timetableRaw
    : (timetableRaw as any)?.data?.items ??
      (timetableRaw as any)?.data ??
      (timetableRaw as any)?.items ??
      (timetableRaw as any)?.slots ??
      [];

  const { data: subjectsData } = useSubjects();
  const subjects: any[] = Array.isArray(subjectsData)
    ? subjectsData
    : (subjectsData as any)?.items ?? (subjectsData as any)?.subjects ?? [];

  const { data: teachersData } = useSchoolTeachers();
  const teachers: any[] = Array.isArray(teachersData)
    ? teachersData
    : (teachersData as any)?.items ?? (teachersData as any)?.teachers ?? [];

  // Unique subject IDs for color assignment
  const subjectIds = useMemo(() => {
    return subjects.map((s: any) => String(s.subject_id ?? s.id ?? ""));
  }, [subjects]);

  // Handlers
  const handleYearChange = (val: string | null) => {
    setSelectedYearId(val ?? "");
    setSelectedClassId("");
    setSelectedSectionId("");
  };

  const handleClassChange = (val: string | null) => {
    setSelectedClassId(val ?? "");
    setSelectedSectionId("");
  };

  const handleCellClick = (
    day: string,
    periodId: string,
    existingSlot: any | null
  ) => {
    setSelectedCell({ day, periodId });
    setExistingSlotForEdit(existingSlot);
    setShowAssignSlot(true);
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Define periods and assign subjects to the weekly schedule"
      />

      <div className="flex gap-6">
        {/* LEFT PANEL - Period Definitions (280px) */}
        <div className="w-[280px] shrink-0">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Period Definitions
          </h3>
          <PeriodList
            periods={periods}
            isLoading={periodsLoading}
            onAddClick={() => setShowAddPeriod(true)}
          />
        </div>

        {/* RIGHT PANEL - Weekly Slot Grid */}
        <div className="flex-1 min-w-0">
          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Academic Year
              </Label>
              <Select value={selectedYearId} onValueChange={handleYearChange}>
                <SelectTrigger className="w-44">
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
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Class
              </Label>
              <Select
                value={selectedClassId}
                onValueChange={handleClassChange}
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
                value={selectedSectionId}
                onValueChange={(val) => setSelectedSectionId(val ?? "")}
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

          {/* Grid */}
          {!selectedSectionId ? (
            <div className="rounded-xl border bg-white p-12 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Select a section to view timetable
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Choose academic year, class, and section from the filters above
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSectionId}
                variants={gridFade}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <WeeklyGrid
                  periods={periods}
                  slots={slots}
                  isLoading={timetableLoading}
                  subjects={subjects}
                  subjectIds={subjectIds}
                  teachers={teachers}
                  onCellClick={handleCellClick}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddPeriodDialog open={showAddPeriod} onOpenChange={setShowAddPeriod} />
      <AssignSlotDialog
        open={showAssignSlot}
        onOpenChange={(isOpen) => {
          setShowAssignSlot(isOpen);
          if (!isOpen) {
            setSelectedCell(null);
            setExistingSlotForEdit(null);
          }
        }}
        cell={selectedCell}
        sectionId={selectedSectionId}
        existingSlot={existingSlotForEdit}
        subjects={subjects}
        teachers={teachers}
      />
    </div>
  );
}
