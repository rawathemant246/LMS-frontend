"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function usePeriodDefinitions() {
  return useQuery({
    queryKey: ["period-definitions"],
    queryFn: () => api.get<any>("/api/v1/period-definitions"),
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/period-definitions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["period-definitions"] });
      toast.success("Period created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSectionTimetable(sectionId?: string) {
  return useQuery({
    queryKey: ["timetable", sectionId],
    queryFn: () => api.get<any>(`/api/v1/sections/${sectionId}/timetable`),
    enabled: !!sectionId,
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/timetable-slots", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Slot assigned");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
