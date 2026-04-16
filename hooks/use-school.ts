"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSchoolStudents() {
  return useQuery({
    queryKey: ["school", "students"],
    queryFn: () => api.get<any>("/api/v1/students?per_page=1"),
  });
}

export function useSchoolTeachers() {
  return useQuery({
    queryKey: ["school", "teachers"],
    queryFn: () => api.get<any>("/api/v1/teachers"),
  });
}

export function useSchoolProfile() {
  return useQuery({
    queryKey: ["school", "profile"],
    queryFn: () => api.get<any>("/api/v1/school/profile"),
  });
}

export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: ["school", "academic-year", "current"],
    queryFn: () => api.get<any>("/api/v1/academic-years/current"),
  });
}
