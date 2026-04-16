"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useStartAttempt() {
  return useMutation({
    mutationFn: ({ examId, studentId }: { examId: string; studentId: string }) =>
      api.post<any>(`/api/v1/exams/${examId}/attempt`, { student_id: studentId }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAttempt(attemptId?: string) {
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => api.get<any>(`/api/v1/attempts/${attemptId}`),
    enabled: !!attemptId,
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: string; data: any }) =>
      api.post(`/api/v1/attempts/${attemptId}/answer`, data),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      api.post(`/api/v1/attempts/${attemptId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam submitted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecordViolation() {
  return useMutation({
    mutationFn: ({ attemptId, data }: { attemptId: string; data: any }) =>
      api.post(`/api/v1/attempts/${attemptId}/violation`, data),
  });
}
