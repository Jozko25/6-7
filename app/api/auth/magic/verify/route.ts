import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { encode } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import {
  checkLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
  getLockoutMessage,
} from "@/lib/security/account-lockout";

async function verifyMagicLink(req: NextRequest, token: string, email: string) {
  const requestId = crypto.randomUUID();
  console.info("[magic-verify]", { requestId, emailHash: email.slice(0, 3) });

  // Check lockout status
  const lockoutStatus = await checkLockoutStatus(email);
  if (lockoutStatus.isLocked) {
    console.warn("[magic-verify]", { requestId, reason: "locked" });
    return NextResponse.json(
      { error: getLockoutMessage(lockoutStatus) },
      { status: 429 }
    );
  }

  const record = await prisma.verificationToken.findFirst({
    where: { token, identifier: email },
  });

  if (!record) {
    await recordFailedAttempt(email);
    console.warn("[magic-verify]", { requestId, reason: "no_record" });
    return NextResponse.json(
      { error: "Invalid or expired magic link" },
      { status: 400 }
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    console.warn("[magic-verify]", { requestId, reason: "expired" });
    return NextResponse.json(
      { error: "Magic link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("[magic-verify]", { requestId, reason: "user_not_found" });
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Delete the token immediately (single use)
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // Clear failed attempts on successful verification
  await clearFailedAttempts(email);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const sessionMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  const sessionExpiry = new Date(Date.now() + sessionMaxAge * 1000);

  // NextAuth v5 uses "authjs.session-token" by default
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // Create JWT token (matching NextAuth's JWT strategy)
  const jwtToken = await encode({
    token: {
      email: user.email,
      name: user.name,
      sub: user.id,
      id: user.id,
      role: user.role,
      emailVerified: user.emailVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(sessionExpiry.getTime() / 1000),
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: cookieName,
    maxAge: sessionMaxAge,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieName, jwtToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: sessionExpiry,
  });

  console.info("[magic-verify]", { requestId, userId: user.id });
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
      console.warn("[magic-verify]", { reason: "missing_body_params" });
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }
    return await verifyMagicLink(req, token, email);
  } catch (error) {
    console.error("Magic link verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    console.warn("[magic-verify]", { reason: "missing_query_params" });
    const base = process.env.NEXTAUTH_URL ?? url.origin;
    return NextResponse.redirect(new URL("/auth/error", base));
  }

  const result = await verifyMagicLink(req, token, email);
  if (!result.ok) {
    const base = process.env.NEXTAUTH_URL ?? url.origin;
    return NextResponse.redirect(new URL("/auth/error", base));
  }

  const base = process.env.NEXTAUTH_URL ?? url.origin;
  return NextResponse.redirect(new URL("/admin", base));
}
