"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { useTeachers, useCreateTeacher } from "@/hooks/use-teachers";

// ── Create Teacher Dialog ──────────────────────────────────────────────────────

function CreateTeacherDialog() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [qualification, setQualification] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const mutation = useCreateTeacher();

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmployeeId("");
    setQualification("");
    setDateOfJoining("");
    setEmail("");
    setPhoneNumber("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      employee_id: employeeId,
      qualification,
      date_of_joining: dateOfJoining,
      email,
    };
    if (phoneNumber) payload.phone_number = phoneNumber;

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
        Add Teacher
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="t-first-name">First Name</Label>
              <Input
                id="t-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Priya"
                required
              />
            </div>
            <div>
              <Label htmlFor="t-last-name">Last Name</Label>
              <Input
                id="t-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="t-employee-id">Employee ID</Label>
            <Input
              id="t-employee-id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP001"
              required
            />
          </div>
          <div>
            <Label htmlFor="t-qualification">Qualification</Label>
            <Input
              id="t-qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="B.Ed, M.Sc"
              required
            />
          </div>
          <div>
            <Label htmlFor="t-doj">Date of Joining</Label>
            <Input
              id="t-doj"
              type="date"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="t-email">Email</Label>
            <Input
              id="t-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya.sharma@school.edu"
              required
            />
          </div>
          <div>
            <Label htmlFor="t-phone">Phone Number</Label>
            <Input
              id="t-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Add Teacher"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Teachers Page ──────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: teachersData, isLoading } = useTeachers();

  const teachers: any[] = Array.isArray(teachersData)
    ? teachersData
    : (teachersData as any)?.items ?? (teachersData as any)?.teachers ?? [];

  const filtered = teachers.filter((t) => {
    const fullName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const handleRowClick = (id: string) => {
    router.push(`/admin/teachers/${id}`);
  };

  return (
    <div>
      <PageHeader title="Teachers" description="Manage teaching staff and assignments">
        <CreateTeacherDialog />
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teachers..."
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
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((teacher: any) => {
                const id = String(teacher.teacher_id ?? teacher.id);
                const isActive = (teacher.status ?? teacher.is_active) !== false &&
                  (teacher.status ?? "active") !== "inactive";
                return (
                  <TableRow
                    key={id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(id)}
                  >
                    <TableCell className="font-mono text-sm text-gray-600">
                      {teacher.employee_id ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {teacher.qualification ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {teacher.specialization ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isActive
                            ? "bg-green-100 text-green-700 border-transparent hover:bg-green-100"
                            : "bg-red-100 text-red-700 border-transparent hover:bg-red-100"
                        }
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
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
