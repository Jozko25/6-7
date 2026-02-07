import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Check if token exists and is not expired
    const record = await prisma.verificationToken.findFirst({
      where: { token, identifier: email },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link. Please contact an administrator for a new invitation." },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return NextResponse.json(
        { error: "Invitation link has expired. Please contact an administrator for a new invitation." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if password is already set
    if (user.password) {
      return NextResponse.json(
        { error: "Account is already set up. Please use the login page." },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true, email: user.email });
  } catch (error) {
    console.error("Validate invitation error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
