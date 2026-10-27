import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Ephemeral in-memory sliding-window rate limiter for serverless Edge/Node
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 180; // 180 requests per minute

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const now = Date.now();

  // 1. Rate Limiting on API routes
  if (pathname.startsWith("/api/v1")) {
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + WINDOW_MS;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(ip, record);

    if (record.count > MAX_REQUESTS) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Request rate limit exceeded. Please throttle automated calls.",
            retry_after_seconds: Math.ceil((record.resetAt - now) / 1000),
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 2. Authentication & Role Route Guard
  const isProtected =
    pathname.startsWith("/submissions") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/governance") ||
    pathname.startsWith("/evaluation");

  if (isProtected) {
    const sessionCookie = request.cookies.get("canon_session_token");
    let userRole: string | null = null;

    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value);
        userRole = parsed?.role || null;
      } catch {
        userRole = null;
      }
    }

    // If no valid session exists, redirect to login with safe returnUrl
    if (!userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based restrictions
    if (pathname.startsWith("/review") && userRole === "creator") {
      const submissionsUrl = new URL("/submissions", request.url);
      return NextResponse.redirect(submissionsUrl);
    }

    if (
      (pathname.startsWith("/governance") || pathname.startsWith("/evaluation")) &&
      userRole !== "brand_manager"
    ) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Security Headers
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|llms.txt|security.txt).*)",
  ],
};
