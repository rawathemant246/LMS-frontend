"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/lib/store";

export function useParentProfile() {
  const user = useUserStore((s) => s.user);
  const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.username;
  return useQuery({
    queryKey: ["parent-profile", userId],
    queryFn: async () => {
      const data = await api.get<any>("/api/v1/parents");
      const parents = Array.isArray(data) ? data : data?.data?.items ?? data?.data ?? data?.items ?? [];
      return parents.find((p: any) =>
        p.auth_user_id === userId ||
        p.user_id === userId ||
        String(p.auth_user_id) === String(userId)
      ) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useParentChildren(parentId?: string) {
  return useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: () => api.get<any>(`/api/v1/parents/${parentId}/children`),
    enabled: !!parentId,
  });
}
