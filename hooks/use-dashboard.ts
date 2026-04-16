"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlatformStats, RevenueData, GrowthData } from "@/lib/api-types";

export function usePlatformStats() {
  return useQuery({
    queryKey: ["admin", "stats", "overview"],
    queryFn: () => api.get<PlatformStats>("/auth/api/admin/stats/overview"),
  });
}

export function useRevenueData(months = 12) {
  return useQuery({
    queryKey: ["admin", "stats", "revenue", months],
    queryFn: () => api.get<RevenueData>(`/auth/api/admin/stats/revenue?months=${months}`),
  });
}

export function useGrowthData(months = 12) {
  return useQuery({
    queryKey: ["admin", "stats", "growth", months],
    queryFn: () => api.get<GrowthData>(`/auth/api/admin/stats/growth?months=${months}`),
  });
}
