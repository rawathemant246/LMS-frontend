"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useSchoolStudents() {
  return useQuery({
    queryKey: ["school", "students"],
    queryFn: () => api.get<any>("/api/v1/students?per_page=100"),
  });
}

export function useSchoolTeachers() {
  return useQuery({
    queryKey: ["school", "teachers"],
    queryFn: () => api.get<any>("/api/v1/teachers"),
  });
}

export function useSchoolProfile() {
  return useQuery({
    queryKey: ["school", "profile"],
    queryFn: () => api.get<any>("/api/v1/school/profile"),
  });
}

export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: ["school", "academic-year", "current"],
    queryFn: () => api.get<any>("/api/v1/academic-years/current"),
  });
}

export function useUpdateSchoolProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/school/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school", "profile"] });
      toast.success("School profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
