"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Upload, Search, FileX } from "lucide-react";
import Link from "next/link";
import { useStudents, useCreateStudent, useValidateImport } from "@/hooks/use-students";

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="border-transparent bg-green-100 text-green-700 hover:bg-green-100 capitalize">
        {status}
      </Badge>
    );
  }
  if (status === "withdrawn") {
    return (
      <Badge variant="outline" className="border-transparent bg-red-100 text-red-700 hover:bg-red-100 capitalize">
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="capitalize">
      {status ?? "—"}
    </Badge>
  );
}

// ── Create Student Dialog ──────────────────────────────────────────────────────

function CreateStudentDialog() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [admissionDate, setAdmissionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const mutation = useCreateStudent();

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setAdmissionNumber("");
    setDob("");
    setGender("");
    setAdmissionDate(new Date().toISOString().split("T")[0]);
    setEmail("");
    setPhone("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      first_name: firstName,
      last_name: lastName,
      admission_number: admissionNumber,
      date_of_birth: dob,
      gender,
      admission_date: admissionDate,
    };
    if (email) payload.email = email;
    if (phone) payload.phone_number = phone;

    mutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Student
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="st-first">First Name</Label>
              <Input
                id="st-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Aarav"
                required
              />
            </div>
            <div>
              <Label htmlFor="st-last">Last Name</Label>
              <Input
                id="st-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="st-adm">Admission Number</Label>
            <Input
              id="st-adm"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              placeholder="ADM-2026-001"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="st-dob">Date of Birth</Label>
              <Input
                id="st-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(val) => setGender(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="st-adm-date">Admission Date</Label>
            <Input
              id="st-adm-date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="st-email">Email (optional)</Label>
            <Input
              id="st-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
            />
          </div>
          <div>
            <Label htmlFor="st-phone">Phone Number (optional)</Label>
            <Input
              id="st-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !gender}
          >
            {mutation.isPending ? "Creating..." : "Create Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CSV Import Dialog ──────────────────────────────────────────────────────────

function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    valid_count: number;
    invalid_count: number;
    errors: string[];
  } | null>(null);

  const mutation = useValidateImport();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResult(null);
      setDragOver(false);
    }
  };

  const processFile = (file: File) => {
    mutation.mutate(file, {
      onSuccess: (data: any) => {
        setResult({
          valid_count: data.valid_count ?? data.valid ?? 0,
          invalid_count: data.invalid_count ?? data.invalid ?? 0,
          errors: data.errors ?? data.error_list ?? [],
        });
      },
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Students via CSV</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50"
              }`}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Drop your CSV file here
              </p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {mutation.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-sm text-gray-500 text-center">Validating file...</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-green-600">{result.valid_count}</p>
                  <p className="text-xs text-gray-500">Valid rows</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-red-500">{result.invalid_count}</p>
                  <p className="text-xs text-gray-500">Invalid rows</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 max-h-48 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700 flex items-start gap-1">
                      <FileX className="h-3 w-3 mt-0.5 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {result.errors.length === 0 && (
                <p className="text-sm text-green-600 text-center font-medium">
                  All rows are valid!
                </p>
              )}

              <p className="text-xs text-gray-400 text-center">
                Bulk import (execute) coming in Phase 2.
              </p>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

// ── Students Table ─────────────────────────────────────────────────────────────

function StudentsTable({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((s) => {
    const fullName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    const admNo = (s.admission_number ?? "").toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || admNo.includes(q);
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                  {search ? "No students match your search" : "No students found"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student: any) => {
                const id = student.student_id ?? student.id;
                return (
                  <TableRow key={id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm text-gray-600">
                      {student.admission_number ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/students/${id}`}
                        className="text-brand-primary hover:underline"
                      >
                        {[student.first_name, student.last_name].filter(Boolean).join(" ") || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {student.class_name ?? student.class?.class_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {student.section_name ?? student.section?.section_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status ?? student.enrollment_status ?? "active"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/students/${id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { data: studentsData, isLoading } = useStudents();

  const students: any[] = Array.isArray(studentsData)
    ? studentsData
    : (studentsData as any)?.items ??
      (studentsData as any)?.students ??
      [];

  return (
    <div>
      <PageHeader title="Students" description="Manage all enrolled students">
        <ImportCsvDialog />
        <CreateStudentDialog />
      </PageHeader>
      <StudentsTable data={students} isLoading={isLoading} />
    </div>
  );
}
