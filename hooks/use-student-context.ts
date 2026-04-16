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
      const data = await api.get<any>("/api/v1/students?per_page=100");
      const students = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      return students.find((s: any) =>
        s.auth_user_id === userId ||
        s.user_id === userId ||
        String(s.auth_user_id) === String(userId)
      ) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
