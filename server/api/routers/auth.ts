import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateTOTPSecret, generateQRCode, verify2FAToken } from "@/server/auth/2fa";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  setup2FASchema,
} from "@/lib/validators/auth";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { sendEmail, passwordResetEmail } from "@/server/services/email";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export const authRouter = createTRPCRouter({
  // Get current user session
  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  // Request password reset (public)
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      // Always return success to avoid user enumeration
      if (!user) {
        return { success: true };
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Remove existing tokens for this user
      await ctx.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      await ctx.prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expires,
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: passwordResetEmail({ url: resetUrl }),
      });

      return { success: true };
    }),

  // Reset password (public)
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const tokenRecord = await ctx.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!tokenRecord || tokenRecord.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired token",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: tokenRecord.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            // Optionally require re-setup of 2FA after reset
            twoFactorEnabled: false,
            twoFactorSecret: null,
          },
        }),
        ctx.prisma.passwordResetToken.deleteMany({
          where: { userId: user.id },
        }),
      ]);

      return { success: true };
    }),

  // Setup 2FA: Generate QR code
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id as string },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (user.twoFactorEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "2FA is already enabled for this account",
      });
    }

    // Generate new TOTP secret
    const { secret, uri } = generateTOTPSecret(user.email);
    const qrCode = await generateQRCode(uri);

    // Save secret (not enabled yet, user needs to verify first)
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return {
      qrCode,
      secret,
    };
  }),

  // Enable 2FA: Verify first token
  enable2FA: protectedProcedure
    .input(setup2FASchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id as string },
      });

      if (!user || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA setup not initiated. Please call setup2FA first.",
        });
      }

      if (user.twoFactorEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is already enabled",
        });
      }

      // Verify the token
      const isValid = verify2FAToken(user.twoFactorSecret, input.token);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid 2FA code. Please try again.",
        });
      }

      // Enable 2FA
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "ENABLE_2FA",
          entity: "User",
          entityId: user.id,
        },
      });

      return { success: true };
    }),

  // Disable 2FA
  disable2FA: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id as string },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is not enabled",
        });
      }

      // Verify the token before disabling
      const isValid = verify2FAToken(user.twoFactorSecret, input.token);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid 2FA code",
        });
      }

      // Disable 2FA
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "DISABLE_2FA",
          entity: "User",
          entityId: user.id,
        },
      });

      return { success: true };
    }),

  // Get 2FA status
  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id as string },
      select: {
        twoFactorEnabled: true,
      },
    });

    return {
      enabled: user?.twoFactorEnabled ?? false,
    };
  }),
});
