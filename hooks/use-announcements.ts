"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<any>("/api/v1/announcements"),
  });
}

export function useAnnouncement(id?: string) {
  return useQuery({
    queryKey: ["announcements", id],
    queryFn: () => api.get<any>(`/api/v1/announcements/${id}`),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/announcements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
