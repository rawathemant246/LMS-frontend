"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTutorAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics", "tutor"],
    queryFn: () =>
      api.get<{
        total_sessions: number;
        total_messages: number;
        avg_messages_per_session: number;
        avg_rating: number;
      }>("/api/v1/admin/analytics/tutor"),
  });
}
