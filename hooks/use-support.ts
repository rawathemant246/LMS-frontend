"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Ticket } from "@/lib/api-types";

export function useTickets(status?: string) {
  return useQuery({
    queryKey: ["admin", "tickets", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("per_page", "50");
      return api.get<PaginatedResponse<Ticket>>(`/auth/api/admin/support/tickets?${params.toString()}`);
    },
  });
}
