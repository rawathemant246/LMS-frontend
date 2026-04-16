import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/favicon.ico"];
const PUBLIC_PREFIXES = ["/_next/", "/api/"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Role-based default dashboard paths (must match lib/role-utils.ts) */
function getDefaultDashboard(pathname: string): string {
  // If already on a known dashboard, stay there
  if (pathname.startsWith("/admin")) return "/admin/dashboard";
  if (pathname.startsWith("/teacher")) return "/teacher/dashboard";
  if (pathname.startsWith("/student")) return "/student/dashboard";
  if (pathname.startsWith("/parent")) return "/parent/dashboard";
  // Super-admin paths
  return "/dashboard";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  // Allow public paths
  if (isPublicPath(pathname)) {
    // Redirect authenticated users away from login
    if (pathname === "/login" && accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other paths — require access_token cookie
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
