"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSchoolStudents,
  useSchoolTeachers,
  useSchoolProfile,
  useCurrentAcademicYear,
} from "@/hooks/use-school";
import {
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Upload,
  FileText,
  BarChart3,
} from "lucide-react";

const quickLinks = [
  {
    title: "Mark Attendance",
    description: "Mark today's attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Import Students",
    description: "Bulk import via CSV",
    href: "/admin/students",
    icon: Upload,
    color: "text-green-600 bg-green-50",
  },
  {
    title: "Create Exam",
    description: "Set up a new exam",
    href: "/admin/exams",
    icon: FileText,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Report Cards",
    description: "Generate report cards",
    href: "/admin/gradebook",
    icon: BarChart3,
    color: "text-orange-600 bg-orange-50",
  },
];

export default function SchoolAdminDashboardPage() {
  const { data: studentsData, isLoading: studentsLoading } = useSchoolStudents();
  const { data: teachersData, isLoading: teachersLoading } = useSchoolTeachers();
  const { data: profileData, isLoading: profileLoading } = useSchoolProfile();
  const { data: academicYearData, isLoading: academicYearLoading } = useCurrentAcademicYear();

  const studentCount: number = studentsData?.total ?? studentsData?.meta?.total ?? 0;
  const teacherCount: number = Array.isArray(teachersData)
    ? teachersData.length
    : (teachersData?.total ?? teachersData?.meta?.total ?? 0);

  const schoolName: string =
    profileData?.name ?? profileData?.school?.name ?? "";

  const academicYearLabel: string =
    academicYearData?.name ??
    academicYearData?.label ??
    academicYearData?.academic_year ??
    "—";

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const kpisLoading =
    studentsLoading || teachersLoading || profileLoading || academicYearLoading;

  return (
    <div>
      <PageHeader
        title="School Dashboard"
        description={schoolName ? `Welcome back — ${schoolName}` : "School overview and quick actions"}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              title="Total Students"
              value={studentCount}
              icon={Users}
              index={0}
            />
            <KpiCard
              title="Total Teachers"
              value={teacherCount}
              icon={GraduationCap}
              index={1}
            />
            <KpiCard
              title="Attendance Today"
              value={0}
              suffix="%"
              icon={ClipboardCheck}
              index={2}
            />
            <KpiCard
              title="Fee Collection"
              value={0}
              prefix="₹"
              suffix="L"
              icon={BookOpen}
              index={3}
            />
          </>
        )}
      </div>

      {/* Date + Academic Year strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="p-2 rounded-lg bg-sky-50">
              <CalendarDays className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Today&apos;s Date</p>
              <p className="text-lg font-semibold text-gray-900">{todayLabel}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="p-2 rounded-lg bg-amber-50">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Current Academic Year</p>
              {academicYearLoading ? (
                <Skeleton className="h-6 w-32 mt-1" />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{academicYearLabel}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ title, description, href, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
