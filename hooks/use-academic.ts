"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: () => api.get<any>("/api/v1/academic-years"),
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/academic-years", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useClasses(academicYearId?: string) {
  return useQuery({
    queryKey: ["classes", academicYearId],
    queryFn: () => api.get<any>(`/api/v1/academic-years/${academicYearId}/classes`),
    enabled: !!academicYearId,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/classes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSections(classId?: string) {
  return useQuery({
    queryKey: ["sections", classId],
    queryFn: () => api.get<any>(`/api/v1/classes/${classId}/sections`),
    enabled: !!classId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/sections", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      toast.success("Section created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<any>("/api/v1/subjects"),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/subjects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
