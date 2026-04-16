"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.get<any>("/api/v1/teachers"),
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ["teachers", id],
    queryFn: () => api.get<any>(`/api/v1/teachers/${id}`),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/teachers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
