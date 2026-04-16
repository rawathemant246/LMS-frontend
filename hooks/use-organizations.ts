"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Organization } from "@/lib/api-types";

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get<Organization[]>("/auth/api/v1/orgs"),
  });
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: ["organizations", id],
    queryFn: () => api.get<Organization>(`/auth/api/v1/orgs/${id}`),
    enabled: !!id,
  });
}
