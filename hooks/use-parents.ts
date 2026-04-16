"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useParents() {
  return useQuery({
    queryKey: ["parents"],
    queryFn: () => api.get<any>("/api/v1/parents"),
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/api/v1/parents", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      toast.success("Parent created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useParentChildren(parentId: string) {
  return useQuery({
    queryKey: ["parents", parentId, "children"],
    queryFn: () => api.get<any>(`/api/v1/parents/${parentId}/children`),
    enabled: !!parentId,
  });
}
