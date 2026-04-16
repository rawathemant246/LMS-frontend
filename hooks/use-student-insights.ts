"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useStudentMastery(studentId?: string) {
  return useQuery({
    queryKey: ["student-mastery", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/mastery`),
    enabled: !!studentId,
  });
}

export function useStudentGradebook(studentId?: string) {
  return useQuery({
    queryKey: ["student-gradebook", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/gradebook`),
    enabled: !!studentId,
  });
}

export function useStudentAttendance(studentId?: string) {
  return useQuery({
    queryKey: ["student-attendance-detail", studentId],
    queryFn: () => api.get<any>(`/api/v1/students/${studentId}/attendance`),
    enabled: !!studentId,
  });
}

export function useTutorSessions() {
  return useQuery({
    queryKey: ["tutor-sessions"],
    queryFn: () => api.get<any>("/api/v1/tutor/sessions"),
  });
}

export function useTutorSessionMessages(sessionId?: string) {
  return useQuery({
    queryKey: ["tutor-sessions", sessionId, "messages"],
    queryFn: () =>
      api.get<any>(`/api/v1/tutor/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
  });
}
