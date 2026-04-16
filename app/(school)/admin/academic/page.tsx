"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useClasses,
  useCreateClass,
  useSections,
  useCreateSection,
  useSubjects,
  useCreateSubject,
} from "@/hooks/use-academic";

// ── helpers ────────────────────────────────────────────────────────────────────

const NEP_STAGE_COLORS: Record<string, string> = {
  foundational: "bg-green-100 text-green-700 hover:bg-green-100",
  preparatory: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  middle: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  secondary: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

const CATEGORY_COLORS: Record<string, string> = {
  core: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  elective: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  language: "bg-green-100 text-green-700 hover:bg-green-100",
  co_curricular: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  vocational: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

function StageBadge({ stage }: { stage: string }) {
  const cls = NEP_STAGE_COLORS[stage?.toLowerCase()] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cls}`}>
      {stage}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category?.toLowerCase()] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${cls}`}>
      {category?.replace("_", " ")}
    </Badge>
  );
}

// ── Create Academic Year Dialog ────────────────────────────────────────────────

function CreateAcademicYearDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const mutation = useCreateAcademicYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { label, start_date: startDate, end_date: endDate, is_current: isCurrent },
      {
        onSuccess: () => {
          setOpen(false);
          setLabel("");
          setStartDate("");
          setEndDate("");
          setIsCurrent(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Academic Year
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="ay-label">Label</Label>
            <Input
              id="ay-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2026-27"
              required
            />
          </div>
          <div>
            <Label htmlFor="ay-start">Start Date</Label>
            <Input
              id="ay-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ay-end">End Date</Label>
            <Input
              id="ay-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="ay-current"
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="ay-current">Mark as current year</Label>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Academic Year"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Class Dialog ────────────────────────────────────────────────────────

function CreateClassDialog({ academicYearId }: { academicYearId: string }) {
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [classOrder, setClassOrder] = useState("");
  const [nepStage, setNepStage] = useState("");

  const mutation = useCreateClass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        class_name: className,
        class_order: Number(classOrder),
        nep_stage: nepStage,
        academic_year_id: academicYearId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setClassName("");
          setClassOrder("");
          setNepStage("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Class
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="cls-name">Class Name</Label>
            <Input
              id="cls-name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Class 1"
              required
            />
          </div>
          <div>
            <Label htmlFor="cls-order">Class Order</Label>
            <Input
              id="cls-order"
              type="number"
              value={classOrder}
              onChange={(e) => setClassOrder(e.target.value)}
              placeholder="e.g. 1"
              required
            />
          </div>
          <div>
            <Label>NEP Stage</Label>
            <Select value={nepStage} onValueChange={(val) => setNepStage(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select NEP stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foundational">Foundational</SelectItem>
                <SelectItem value="preparatory">Preparatory</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending || !nepStage}>
            {mutation.isPending ? "Creating..." : "Create Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Section Dialog ──────────────────────────────────────────────────────

function CreateSectionDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [capacity, setCapacity] = useState("");

  const mutation = useCreateSection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { section_name: sectionName, capacity: Number(capacity), class_id: classId },
      {
        onSuccess: () => {
          setOpen(false);
          setSectionName("");
          setCapacity("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4 mr-1" />
        Add Section
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="sec-name">Section Name</Label>
            <Input
              id="sec-name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. A"
              required
            />
          </div>
          <div>
            <Label htmlFor="sec-cap">Capacity</Label>
            <Input
              id="sec-cap"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 40"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Add Section"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Subject Dialog ──────────────────────────────────────────────────────

function CreateSubjectDialog() {
  const [open, setOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [category, setCategory] = useState("");

  const mutation = useCreateSubject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { subject_name: subjectName, subject_code: subjectCode, category },
      {
        onSuccess: () => {
          setOpen(false);
          setSubjectName("");
          setSubjectCode("");
          setCategory("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Subject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="sub-name">Subject Name</Label>
            <Input
              id="sub-name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
              required
            />
          </div>
          <div>
            <Label htmlFor="sub-code">Subject Code</Label>
            <Input
              id="sub-code"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. MATH01"
              required
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="language">Language</SelectItem>
                <SelectItem value="co_curricular">Co-Curricular</SelectItem>
                <SelectItem value="vocational">Vocational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending || !category}>
            {mutation.isPending ? "Creating..." : "Create Subject"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Sections Sub-Table ─────────────────────────────────────────────────────────

function SectionsPanel({ classId, className }: { classId: string; className: string }) {
  const { data: sectionsData, isLoading } = useSections(classId);
  const sections: any[] = Array.isArray(sectionsData)
    ? sectionsData
    : (sectionsData as any)?.items ?? (sectionsData as any)?.sections ?? [];

  return (
    <div className="mt-4 ml-6 rounded-xl border bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Sections — {className}
        </h3>
        <CreateSectionDialog classId={classId} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Section Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Class Teacher</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              </TableRow>
            ))
          ) : sections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                No sections yet
              </TableCell>
            </TableRow>
          ) : (
            sections.map((sec: any) => (
              <TableRow key={sec.section_id ?? sec.id}>
                <TableCell className="font-medium">{sec.section_name ?? sec.name}</TableCell>
                <TableCell>{sec.capacity ?? "—"}</TableCell>
                <TableCell className="text-gray-500">
                  {sec.class_teacher_name ?? sec.teacher_name ?? "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Academic Years Tab ─────────────────────────────────────────────────────────

function AcademicYearsTab() {
  const { data: yearsData, isLoading } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CreateAcademicYearDialog />
      </div>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Current</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : years.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-12">
                  No academic years configured
                </TableCell>
              </TableRow>
            ) : (
              years.map((year: any) => (
                <TableRow key={year.academic_year_id ?? year.id}>
                  <TableCell className="font-medium">{year.label ?? year.name}</TableCell>
                  <TableCell className="text-gray-500">{year.start_date ?? "—"}</TableCell>
                  <TableCell className="text-gray-500">{year.end_date ?? "—"}</TableCell>
                  <TableCell>
                    {year.is_current ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-transparent">
                        Current
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Classes & Sections Tab ─────────────────────────────────────────────────────

function ClassesSectionsTab() {
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const { data: yearsData } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  const { data: classesData, isLoading: classesLoading } = useClasses(selectedYearId || undefined);
  const classes: any[] = Array.isArray(classesData)
    ? classesData
    : (classesData as any)?.items ?? (classesData as any)?.classes ?? [];

  const handleRowClick = (classId: string) => {
    setExpandedClassId((prev) => (prev === classId ? null : classId));
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm font-medium">Academic Year</Label>
          <Select value={selectedYearId} onValueChange={(val) => setSelectedYearId(val ?? "")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year: any) => (
                <SelectItem
                  key={year.academic_year_id ?? year.id}
                  value={String(year.academic_year_id ?? year.id)}
                >
                  {year.label ?? year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedYearId && (
          <div className="ml-auto">
            <CreateClassDialog academicYearId={selectedYearId} />
          </div>
        )}
      </div>

      {!selectedYearId ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
          Select an academic year to view classes
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>NEP Stage</TableHead>
                <TableHead>Class Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-12">
                    No classes for this academic year
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls: any) => {
                  const classId = String(cls.class_id ?? cls.id);
                  const isExpanded = expandedClassId === classId;
                  return (
                    <>
                      <TableRow
                        key={classId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(classId)}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            >
                              ▶
                            </span>
                            {cls.class_name ?? cls.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {cls.nep_stage ? <StageBadge stage={cls.nep_stage} /> : "—"}
                        </TableCell>
                        <TableCell className="text-gray-500">{cls.class_order ?? "—"}</TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${classId}-sections`}>
                          <TableCell colSpan={3} className="p-0 border-0">
                            <SectionsPanel
                              classId={classId}
                              className={cls.class_name ?? cls.name}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Subjects Tab ───────────────────────────────────────────────────────────────

function SubjectsTab() {
  const { data: subjectsData, isLoading } = useSubjects();
  const subjects: any[] = Array.isArray(subjectsData)
    ? subjectsData
    : (subjectsData as any)?.items ?? (subjectsData as any)?.subjects ?? [];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CreateSubjectDialog />
      </div>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-12">
                  No subjects configured
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((sub: any) => (
                <TableRow key={sub.subject_id ?? sub.id}>
                  <TableCell className="font-medium">{sub.subject_name ?? sub.name}</TableCell>
                  <TableCell className="text-gray-500 font-mono">{sub.subject_code ?? sub.code ?? "—"}</TableCell>
                  <TableCell>
                    {sub.category ? <CategoryBadge category={sub.category} /> : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AcademicSetupPage() {
  return (
    <div>
      <PageHeader
        title="Academic Setup"
        description="Configure academic years, classes, sections, and subjects"
      />
      <Tabs defaultValue="academic-years" className="space-y-4">
        <TabsList>
          <TabsTrigger value="academic-years">Academic Years</TabsTrigger>
          <TabsTrigger value="classes">Classes &amp; Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        <TabsContent value="academic-years">
          <AcademicYearsTab />
        </TabsContent>
        <TabsContent value="classes">
          <ClassesSectionsTab />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
