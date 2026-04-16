"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Invoice } from "@/lib/api-types";

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.get<any[]>("/auth/api/v1/billing/plans"),
  });
}

export function useInvoices(page = 1) {
  return useQuery({
    queryKey: ["admin", "invoices", page],
    queryFn: () => api.get<PaginatedResponse<Invoice>>(`/auth/api/admin/invoices?page=${page}&per_page=20`),
  });
}
