"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";
import { getCookie } from "@/lib/auth";
import { toast } from "sonner";

export function useChapters(subjectId?: string) {
  return useQuery({
    queryKey: ["chapters", subjectId],
    queryFn: () => api.get<any>(`/api/v1/subjects/${subjectId}/chapters`),
    enabled: !!subjectId,
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/chapters", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTopics(chapterId?: string) {
  return useQuery({
    queryKey: ["topics", chapterId],
    queryFn: () => api.get<any>(`/api/v1/chapters/${chapterId}/topics`),
    enabled: !!chapterId,
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/topics", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      toast.success("Topic created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLearningObjects(topicId?: string) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic_id", topicId);
  return useQuery({
    queryKey: ["learning-objects", topicId],
    queryFn: () => api.get<any>(`/api/v1/learning-objects?${params.toString()}`),
    enabled: !!topicId,
  });
}

export function useCreateLearningObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/learning-objects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-objects"] });
      toast.success("Learning object created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContentOrder(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => api.put(`/api/v1/topics/${topicId}/content-order`, { order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-objects"] });
      toast.success("Order updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUploadDirect() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = getCookie("access_token") || "";
      const res = await fetch(
        `${API_BASE}/api/v1/uploads/direct`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (res.status === 401) {
        document.cookie = "access_token=; path=/; max-age=0";
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body?.error || body?.detail || "Upload failed");
      }
      return res.json();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
