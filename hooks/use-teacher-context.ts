"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/lib/store";

export function useTeacherProfile() {
  const user = useUserStore((s) => s.user);
  const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.username;
  return useQuery({
    queryKey: ["teacher-profile", userId],
    queryFn: async () => {
      // No /teachers/me endpoint exists; fetch list and match by auth_user_id
      const data = await api.get<any>("/api/v1/teachers");
      const teachers = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      return teachers.find((t: any) =>
        t.auth_user_id === userId ||
        t.user_id === userId ||
        String(t.auth_user_id) === String(userId)
      ) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 min to avoid repeated fetches
  });
}

export function useTeacherAssignments(teacherId?: string) {
  return useQuery({
    queryKey: ["teacher-assignments", teacherId],
    queryFn: () => api.get<any>(`/api/v1/teachers/${teacherId}/assignments`),
    enabled: !!teacherId,
  });
}

export function useMyClasses(teacherId?: string) {
  const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
  return useMemo(() => {
    const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.data?.items ?? assignmentsRaw?.data ?? [];
    const seen = new Set<string>();
    return assignments.filter((a: any) => {
      const key = `${a.class_id}-${a.section_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [assignmentsRaw]);
}

export function useMySubjects(teacherId?: string) {
  const { data: assignmentsRaw } = useTeacherAssignments(teacherId);
  return useMemo(() => {
    const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.data?.items ?? assignmentsRaw?.data ?? [];
    const seen = new Set<string>();
    return assignments.filter((a: any) => {
      if (seen.has(a.subject_id)) return false;
      seen.add(a.subject_id);
      return true;
    });
  }, [assignmentsRaw]);
}
