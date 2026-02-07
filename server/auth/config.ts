import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/db/client";
import { verify2FAToken } from "./2fa";
import bcrypt from "bcryptjs";
import { sendEmail, magicLinkEmail } from "@/server/services/email";
import {
  checkLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
  getLockoutMessage,
} from "@/lib/security/account-lockout";

const providers: any[] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      totpToken: { label: "2FA Code", type: "text" },
    },
    async authorize(credentials) {
        // Step 1: Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const email = credentials.email as string;

        // Step 2: Check lockout status
        const lockoutStatus = await checkLockoutStatus(email);
        if (lockoutStatus.isLocked) {
          throw new Error(getLockoutMessage(lockoutStatus));
        }

        // Step 3: Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          // Record failed attempt even for non-existent users (prevents enumeration)
          await recordFailedAttempt(email);
          throw new Error("Invalid credentials");
        }

        // Step 4: Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          const status = await recordFailedAttempt(email);
          if (status.isLocked) {
            throw new Error(getLockoutMessage(status));
          }
          throw new Error(`Invalid credentials. ${getLockoutMessage(status)}`);
        }

        // Step 5: Check if 2FA is enabled
        if (user.twoFactorEnabled) {
          if (!credentials.totpToken) {
            throw new Error("2FA_REQUIRED");
          }

          const is2FAValid = verify2FAToken(
            user.twoFactorSecret!,
            credentials.totpToken as string
          );

          if (!is2FAValid) {
            const status = await recordFailedAttempt(email);
            if (status.isLocked) {
              throw new Error(getLockoutMessage(status));
            }
            throw new Error(`Invalid 2FA code. ${getLockoutMessage(status)}`);
          }
        }

        // Step 6: Clear failed attempts on successful login
        await clearFailedAttempts(email);

        // Step 7: Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Step 8: Return user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    })
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
});
