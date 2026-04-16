"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.get<any[]>("/auth/api/v1/billing/plans"),
  });
}

export function useInvoices(page = 1) {
  return useQuery({
    queryKey: ["admin", "invoices", page],
    queryFn: () => api.get<any>(`/auth/api/admin/invoices?page=${page}&per_page=20`),
  });
}

export function useRevenueStats() {
  return useQuery({
    queryKey: ["admin", "stats", "revenue"],
    queryFn: () => api.get<any>("/auth/api/admin/stats/revenue?months=12"),
  });
}
