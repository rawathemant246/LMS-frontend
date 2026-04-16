"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useStudents(classId?: string, sectionId?: string, page = 1) {
  const params = new URLSearchParams();
  if (classId) params.set("class_id", classId);
  if (sectionId) params.set("section_id", sectionId);
  params.set("page", String(page));
  params.set("per_page", "25");
  return useQuery({
    queryKey: ["students", classId, sectionId, page],
    queryFn: () => api.get<any>(`/api/v1/students?${params.toString()}`),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => api.get<any>(`/api/v1/students/${id}`),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/students", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStudentParents(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "parents"],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/parents`),
    enabled: !!studentId,
  });
}

export function useValidateImport() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/students/import/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${document.cookie.match(/access_token=([^;]+)/)?.[1] || ""}`,
          },
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Validation failed");
      return res.json();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
