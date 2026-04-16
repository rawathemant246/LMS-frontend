import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Protect everything except auth pages and static assets
  const publicPaths = ["/login", "/forgot-password"];
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p));

  if (!token && !isPublicPath) {
    // No token and not on a public page → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    // Has token but on login page → redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|healthz).*)"],
};
