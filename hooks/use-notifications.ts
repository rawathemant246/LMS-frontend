"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Note: /admin/notifications routes are scoped by user_id from JWT claims,
// not restricted to admin role. The "admin" prefix is a backend route namespace.
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any>("/api/v1/admin/notifications"),
  });
}

// Note: /admin/notifications routes are scoped by user_id from JWT claims,
// not restricted to admin role. The "admin" prefix is a backend route namespace.
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/admin/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Note: /admin/notifications routes are scoped by user_id from JWT claims,
// not restricted to admin role. The "admin" prefix is a backend route namespace.
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/v1/admin/notifications/read-all"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("All notifications marked as read"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
