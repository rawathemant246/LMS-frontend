import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getRoleFromPayload(payload: any): string | null {
  if (!payload) return null;
  const roleId: number | undefined = payload.role_id;
  const roleName: string | undefined = payload.role_name ?? payload.role;

  if (roleName) {
    const lower = roleName.toLowerCase();
    const exactRoles: Record<string, string> = {
      super_admin: "super_admin",
      admin: "admin",
      principal: "admin",
      school_admin: "admin",
      teacher: "teacher",
      student: "student",
      parent: "parent",
    };
    if (exactRoles[lower]) return exactRoles[lower];
  }
  if (roleId === 1) return "super_admin";
  return null;
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case "super_admin": return "/dashboard";
    case "admin": return "/admin/dashboard";
    case "teacher": return "/teacher/dashboard";
    case "student": return "/student/dashboard";
    case "parent": return "/parent/dashboard";
    default: return "/login";
  }
}

export function proxy(request: NextRequest) {
  const tokenCookie = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Public paths that skip auth
  const publicPaths = ["/login", "/forgot-password"];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!tokenCookie && !isPublicPath) {
    // No token — redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (tokenCookie && isPublicPath) {
    // Has token but on a public page — redirect to their dashboard
    const payload = decodeJwtPayload(tokenCookie.value);
    const role = getRoleFromPayload(payload);
    const destination = role ? getDashboardForRole(role) : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (tokenCookie && !isPublicPath) {
    // Token present on a protected page — enforce role-based route access
    const payload = decodeJwtPayload(tokenCookie.value);
    const role = getRoleFromPayload(payload);

    if (role) {
      const rolePrefixes: Record<string, string[]> = {
        admin: ["/admin"],
        teacher: ["/teacher"],
        student: ["/student"],
        parent: ["/parent"],
        super_admin: ["/dashboard", "/schools", "/organizations", "/users", "/analytics", "/billing", "/support", "/audit", "/health", "/notifications", "/settings"],
      };

      const allowed = rolePrefixes[role] ?? [];

      // Check if the path is role-specific (prefixed with a known role route)
      const allRolePrefixes = ["/admin", "/teacher", "/student", "/parent", "/dashboard", "/schools", "/organizations", "/users", "/analytics", "/billing", "/support", "/audit", "/health", "/notifications", "/settings"];
      const isRoleSpecificPath = allRolePrefixes.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );

      if (isRoleSpecificPath) {
        const hasAccess = allowed.some(
          (p) => pathname === p || pathname.startsWith(p + "/")
        );
        if (!hasAccess) {
          // Wrong role for this path — redirect to their correct dashboard
          const correctDashboard = getDashboardForRole(role);
          return NextResponse.redirect(new URL(correctDashboard, request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|healthz).*)"],
};
