"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/lib/store";

export function useStudentProfile() {
  const user = useUserStore((s) => s.user);
  const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.username;
  return useQuery({
    queryKey: ["student-profile", userId],
    queryFn: async () => {
      // TODO: Replace with /api/v1/students/me endpoint when available
      const data = await api.get<any>("/api/v1/students?per_page=500");
      const students = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      const profile = students.find((s: any) =>
        s.auth_user_id === userId ||
        s.user_id === userId ||
        String(s.auth_user_id) === String(userId)
      ) ?? null;
      if (!profile) {
        console.warn(`[useStudentProfile] No student profile found for auth user ${userId}`);
      }
      return profile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
