"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useSectionAssignments(sectionId?: string) {
  return useQuery({
    queryKey: ["assignments", sectionId],
    queryFn: () => api.get<any>(`/api/v1/sections/${sectionId}/assignments`),
    enabled: !!sectionId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/assignments", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); toast.success("Assignment created"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAssignment(id?: string) {
  return useQuery({
    queryKey: ["assignments", "detail", id],
    queryFn: () => api.get<any>(`/api/v1/assignments/${id}`),
    enabled: !!id,
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/assignments/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); toast.success("Assignment updated"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/assignments/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); toast.success("Assignment published"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: ["submissions", assignmentId],
    queryFn: () => api.get<any>(`/api/v1/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/api/v1/submissions/${id}/grade`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["submissions"] }); toast.success("Submission graded"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRubrics() {
  return useQuery({ queryKey: ["rubrics"], queryFn: () => api.get<any>("/api/v1/rubrics") });
}

export function useCreateRubric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/rubrics", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rubrics"] }); toast.success("Rubric created"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
