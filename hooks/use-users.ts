"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdminUsers(search?: string, role?: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  params.set("page", String(page));
  params.set("per_page", "25");

  return useQuery({
    queryKey: ["admin", "users", search, role, page],
    queryFn: () => api.get<any>(`/auth/api/admin/users?${params.toString()}`),
  });
}
