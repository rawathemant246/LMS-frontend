import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// JWT helpers (base64 decode only — backend validates signatures)
// ---------------------------------------------------------------------------

function decodeJwtPayload(
  token: string
): {
  sub?: string;
  exp?: number;
  role_id?: number;
  organization_id?: number;
  username?: string;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    return payload;
  } catch {
    return null;
  }
}

// Map role_id -> allowed route prefix (mirrors role-utils.ts detectRole logic)
const ROLE_ROUTE_MAP: Record<number, string> = {
  1: "/dashboard",   // super_admin
  2: "/admin",       // school_admin / principal
  3: "/teacher",
  4: "/student",
  5: "/parent",
};

// Public routes that never require authentication
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/_next", "/favicon.ico"];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  // No token → redirect to login
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(accessToken);

  // Check token expiry
  if (payload?.exp && payload.exp * 1000 < Date.now()) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route enforcement
  const roleId = payload?.role_id;
  if (roleId) {
    const allowedPrefix = ROLE_ROUTE_MAP[roleId];
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }
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
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
