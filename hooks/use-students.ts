"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";
import { getCookie } from "@/lib/auth";
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

      const token = getCookie("access_token") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/students/import/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (res.status === 401) {
        document.cookie = "access_token=; path=/; max-age=0";
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Validation failed" }));
        throw new Error(body?.error || body?.detail || "Validation failed");
      }
      return res.json();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
