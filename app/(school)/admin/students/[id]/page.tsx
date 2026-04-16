"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudent, useStudentParents } from "@/hooks/use-students";
import { formatDate } from "@/lib/utils";

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
      {status ?? "active"}
    </Badge>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

function ProfileTab({ student }: { student: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <InfoRow
            label="Full Name"
            value={[student.first_name, student.last_name].filter(Boolean).join(" ")}
          />
          <InfoRow label="Admission Number" value={student.admission_number} />
          <InfoRow
            label="Date of Birth"
            value={student.date_of_birth ? formatDate(student.date_of_birth) : null}
          />
          <InfoRow label="Gender" value={student.gender} />
          <InfoRow
            label="Class"
            value={student.class_name ?? student.class?.class_name}
          />
          <InfoRow
            label="Section"
            value={student.section_name ?? student.section?.section_name}
          />
          <InfoRow label="House" value={student.house ?? student.house_name} />
          <InfoRow
            label="Admission Date"
            value={student.admission_date ? formatDate(student.admission_date) : null}
          />
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Phone" value={student.phone_number} />
          {(student.emergency_contact_name || student.emergency_contact) && (
            <InfoRow
              label="Emergency Contact"
              value={
                student.emergency_contact_name ??
                student.emergency_contact ??
                null
              }
            />
          )}
          {student.emergency_contact_phone && (
            <InfoRow
              label="Emergency Contact Phone"
              value={student.emergency_contact_phone}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Parents Tab ────────────────────────────────────────────────────────────────

function ParentsTab({ studentId }: { studentId: string }) {
  const { data: parentsData, isLoading } = useStudentParents(studentId);
  const parents: any[] = Array.isArray(parentsData)
    ? parentsData
    : (parentsData as any)?.items ?? (parentsData as any)?.parents ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (parents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center py-8">No parents linked to this student.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {parents.map((parent: any) => {
        const parentId = parent.parent_id ?? parent.id ?? parent.user_id;
        return (
          <Card key={parentId}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {[parent.first_name, parent.last_name].filter(Boolean).join(" ") ||
                      parent.name ||
                      "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {parent.relation ?? parent.relationship ?? "Parent/Guardian"}
                  </p>
                  {parent.phone_number && (
                    <p className="text-sm text-gray-600">{parent.phone_number}</p>
                  )}
                  {parent.email && (
                    <p className="text-sm text-gray-600">{parent.email}</p>
                  )}
                </div>
                {parent.is_primary && (
                  <Badge
                    variant="outline"
                    className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100"
                  >
                    Primary
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = String(params.id);
  const { data: student, isLoading } = useStudent(studentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return <p className="text-gray-500">Student not found.</p>;
  }

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
  const status = student.status ?? student.enrollment_status ?? "active";

  return (
    <div>
      <PageHeader title={fullName} description={`Admission No: ${student.admission_number ?? "—"}`}>
        <StatusBadge status={status} />
      </PageHeader>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab student={student} />
        </TabsContent>

        <TabsContent value="parents">
          <ParentsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">View attendance history here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">View grades and report cards here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
