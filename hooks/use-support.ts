"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTickets(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["admin", "tickets", status],
    queryFn: () => api.get<any>(`/auth/api/admin/support/tickets${params}&per_page=50`),
  });
}
