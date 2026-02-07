import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  const baseUrl =
    (forwardedProto && host && `${forwardedProto}://${host}`) ||
    (process.env.NEXTAUTH_URL ?? url.origin);

  console.info("[magic-verify-route]", {
    hasToken: !!token,
    hasEmail: !!email,
    forwardedProto,
    forwardedHost,
    host,
    baseUrl,
  });

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/error", baseUrl));
  }

  const query = new URLSearchParams({ token, email }).toString();
  return NextResponse.redirect(
    new URL(`/api/auth/magic/verify?${query}`, baseUrl)
  );
}
