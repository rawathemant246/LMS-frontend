import { api } from "./api";
import type { LoginResponse } from "./api-types";
import { useUserStore } from "./store";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/api/v1/auth/login", {
    username,
    password,
  });

  // Store token in cookie
  const isSecure = window.location.protocol === "https:";
  document.cookie = `access_token=${res.tokens.access_token}; path=/; max-age=${res.tokens.expires_in}; SameSite=Strict${isSecure ? "; Secure" : ""}`;

  // Store user in Zustand
  useUserStore.getState().setUser(res.user);

  return res;
}

export function logout() {
  document.cookie = "access_token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("access_token=");
}
