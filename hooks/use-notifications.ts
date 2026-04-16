"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any>("/api/v1/admin/notifications"),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/v1/admin/notifications/read-all"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("All notifications marked as read"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
