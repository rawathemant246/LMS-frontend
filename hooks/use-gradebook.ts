"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useGradeScales() {
  return useQuery({ queryKey: ["grade-scales"], queryFn: () => api.get<any>("/api/v1/grade-scales") });
}

export function useGradeScale(id?: string) {
  return useQuery({ queryKey: ["grade-scales", id], queryFn: () => api.get<any>(`/api/v1/grade-scales/${id}`), enabled: !!id });
}

export function useCreateGradeScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/grade-scales", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grade-scales"] }); toast.success("Grade scale created"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/report-cards/generate", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["report-cards"] }); toast.success("Report cards generated"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePublishReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/report-cards/publish", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["report-cards"] }); toast.success("Report cards published"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStudentReportCards(studentId?: string) {
  return useQuery({
    queryKey: ["report-cards", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/report-cards`),
    enabled: !!studentId,
  });
}

export function useReportCardPdf(reportCardId?: string) {
  return useQuery({
    queryKey: ["report-card-pdf", reportCardId],
    queryFn: async () => {
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/report-cards/${reportCardId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch PDF");
      return URL.createObjectURL(await res.blob());
    },
    enabled: !!reportCardId,
  });
}
