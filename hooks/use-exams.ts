"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useExams() {
  return useQuery({ queryKey: ["exams"], queryFn: () => api.get<any>("/api/v1/exams") });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/exams", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); toast.success("Exam created"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExam(id?: string) {
  return useQuery({ queryKey: ["exams", id], queryFn: () => api.get<any>(`/api/v1/exams/${id}`), enabled: !!id });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/exams/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); toast.success("Exam published"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAutoGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: any }) => api.post(`/api/v1/exams/${examId}/auto-generate`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); toast.success("Exam paper generated"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExamResults(examId?: string) {
  return useQuery({ queryKey: ["exam-results", examId], queryFn: () => api.get<any>(`/api/v1/exams/${examId}/results`), enabled: !!examId });
}

export function useBulkMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: any }) => api.post(`/api/v1/exams/${examId}/bulk-marks`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-results"] }); toast.success("Marks saved"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeclareResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => api.post(`/api/v1/exams/${examId}/declare-results`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); toast.success("Results declared"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useQuestions(filters?: { subject_id?: string; chapter_id?: string; question_type?: string; difficulty?: string }) {
  const params = new URLSearchParams();
  if (filters?.subject_id) params.set("subject_id", filters.subject_id);
  if (filters?.chapter_id) params.set("chapter_id", filters.chapter_id);
  if (filters?.question_type) params.set("question_type", filters.question_type);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  return useQuery({ queryKey: ["questions", filters], queryFn: () => api.get<any>(`/api/v1/questions?${params.toString()}`) });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/questions", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["questions"] }); toast.success("Question created"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVerifyQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/questions/${id}/verify`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["questions"] }); toast.success("Question verified"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
