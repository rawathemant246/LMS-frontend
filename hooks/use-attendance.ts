"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAttendance(sectionId?: string, date?: string) {
  const params = new URLSearchParams();
  if (sectionId) params.set("section_id", sectionId);
  if (date) params.set("date", date);
  return useQuery({
    queryKey: ["attendance", sectionId, date],
    queryFn: () => api.get<any>(`/api/v1/attendance/daily?${params.toString()}`),
    enabled: !!sectionId && !!date,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/attendance/daily", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAttendanceReport(sectionId?: string, academicYearId?: string) {
  return useQuery({
    queryKey: ["attendance", "report", sectionId, academicYearId],
    queryFn: () =>
      api.get<any>(
        `/api/v1/attendance/report?section_id=${sectionId}&academic_year_id=${academicYearId}`
      ),
    enabled: !!sectionId && !!academicYearId,
  });
}

export function useSectionStudents(sectionId?: string) {
  const params = new URLSearchParams();
  if (sectionId) params.set("section_id", sectionId);
  params.set("per_page", "100");
  return useQuery({
    queryKey: ["students", "section", sectionId],
    queryFn: () => api.get<any>(`/api/v1/students?${params.toString()}`),
    enabled: !!sectionId,
  });
}
