import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth/verify-magic") || pathname.startsWith("/api/auth/magic/verify")) {
    console.info("[magic-middleware]", {
      path: pathname,
      method: request.method,
      host: request.headers.get("host"),
      url: request.nextUrl.toString(),
    });
  }

  // Get identifier (IP or user ID)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const identifier = token?.id?.toString() ?? ip;

  // Apply rate limiting based on route
  let rateLimitType: "auth" | "api" | "public" = "public";

  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    rateLimitType = "auth";
  } else if (pathname.startsWith("/api")) {
    rateLimitType = "api";
  }

  let success = true;
  let limit = 1000;
  let reset = Date.now() + 60_000;
  let remaining = 1000;

  const disableAuthRateLimit =
    process.env.DISABLE_AUTH_RATELIMIT === "true" ||
    process.env.RAILWAY_ENVIRONMENT;

  if (
    rateLimitType !== "auth" ||
    (!disableAuthRateLimit && process.env.NODE_ENV === "production")
  ) {
    ({ success, limit, reset, remaining } = await checkRateLimit(
      identifier,
      rateLimitType
    ));
  }

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  // Check authentication for admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Stricter referrer policy for auth pages (prevents token leakage)
  if (pathname.startsWith("/auth")) {
    response.headers.set("Referrer-Policy", "no-referrer");
  } else {
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Only add HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Add rate limit headers to response
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
