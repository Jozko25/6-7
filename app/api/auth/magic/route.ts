import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/server/db/client";
import { sendEmail, magicLinkEmail } from "@/server/services/email";
import { checkLockoutStatus, getLockoutMessage } from "@/lib/security/account-lockout";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check lockout status
  const lockoutStatus = await checkLockoutStatus(email);
  if (lockoutStatus.isLocked) {
    return NextResponse.json(
      { error: getLockoutMessage(lockoutStatus) },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Do not leak existence - still return success
    return NextResponse.json({ success: true });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // Link goes to a landing page that will POST the token (prevents referrer leak)
  const baseUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const url = `${baseUrl}/api/auth/magic/verify?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Your sign-in link",
    html: magicLinkEmail({ url }),
  });

  return NextResponse.json({ success: true });
}
