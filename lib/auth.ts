import { api } from "./api";
import type { LoginResponse } from "./api-types";
import { useUserStore } from "./store";
import { useSchoolStore } from "./school-store";
import { detectRole, getRoleDashboardPath } from "./role-utils";

export interface LoginResult {
  res: LoginResponse;
  redirectPath: string;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await api.post<LoginResponse>("/auth/api/v1/auth/login", {
    username,
    password,
  });

  // Store token in cookie
  const isSecure = window.location.protocol === "https:";
  document.cookie = `access_token=${res.tokens.access_token}; path=/; max-age=${res.tokens.expires_in}; SameSite=Strict${isSecure ? "; Secure" : ""}`;

  // Store user in Zustand
  useUserStore.getState().setUser(res.user);

  // Detect role and store in school store
  const role = detectRole(res.user.role_id);
  useSchoolStore.getState().setRole(role);

  // If not super_admin, fetch school profile
  if (role !== "super_admin") {
    try {
      const schoolProfile = await api.get<{
        name: string;
        board: string;
        logo_url: string;
        branding: {
          primary_color?: string;
          accent_color?: string;
          sidebar_color?: string;
          logo_url?: string;
        };
      }>("/api/v1/school/profile");
      useSchoolStore.getState().setSchool(schoolProfile);
    } catch {
      // Non-fatal: proceed without school branding
    }
  }

  const redirectPath = getRoleDashboardPath(role);
  return { res, redirectPath };
}

export function logout() {
  useUserStore.getState().clearUser();
  useSchoolStore.getState().clearSchool();
  document.cookie = "access_token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("access_token=");
}
