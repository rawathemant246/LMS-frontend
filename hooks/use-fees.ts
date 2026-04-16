"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useFeeHeads() {
  return useQuery({
    queryKey: ["fee-heads"],
    queryFn: () => api.get<any>("/api/v1/fee-heads"),
  });
}

export function useCreateFeeHead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/fee-heads", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-heads"] });
      toast.success("Fee head created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useFeeStructures(yearId?: string, classId?: string) {
  const params = new URLSearchParams();
  if (yearId) params.set("academic_year_id", yearId);
  if (classId) params.set("class_id", classId);
  return useQuery({
    queryKey: ["fee-structures", yearId, classId],
    queryFn: () => api.get<any>(`/api/v1/fee-structures?${params.toString()}`),
    enabled: !!yearId,
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/fee-structures", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Fee structure created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDefaulters() {
  return useQuery({
    queryKey: ["fee-defaulters"],
    queryFn: () => api.get<any>("/api/v1/fee-reports/defaulters"),
  });
}
