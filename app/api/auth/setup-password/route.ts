import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the invitation token
    const record = await prisma.verificationToken.findFirst({
      where: { token, identifier: email },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
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

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password and mark email as verified
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // Delete the invitation token
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup password error:", error);
    return NextResponse.json(
      { error: "An error occurred while setting up your password" },
      { status: 500 }
    );
  }
}
