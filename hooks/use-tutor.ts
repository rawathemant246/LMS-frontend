"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useTutorSessions() {
  return useQuery({
    queryKey: ["tutor-sessions"],
    queryFn: () => api.get<any>("/api/v1/tutor/sessions"),
  });
}

export function useCreateTutorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>("/api/v1/tutor/sessions", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-sessions"] }); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTutorSession(id?: string) {
  return useQuery({
    queryKey: ["tutor-sessions", id],
    queryFn: () => api.get<any>(`/api/v1/tutor/sessions/${id}`),
    enabled: !!id,
  });
}

export function useTutorMessages(sessionId?: string) {
  return useQuery({
    queryKey: ["tutor-messages", sessionId],
    queryFn: () => api.get<any>(`/api/v1/tutor/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

export function useSendTutorMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      api.post<any>(`/api/v1/tutor/sessions/${sessionId}/messages`, { content }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tutor-messages", variables.sessionId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRateSession() {
  return useMutation({
    mutationFn: ({ sessionId, rating }: { sessionId: string; rating: number }) =>
      api.post(`/api/v1/tutor/sessions/${sessionId}/rate`, { rating }),
    onSuccess: () => toast.success("Thanks for your feedback!"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/api/v1/tutor/sessions/${sessionId}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-sessions"] });
      toast.success("Session closed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
