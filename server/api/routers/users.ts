import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "@/lib/validators/user";
import { hasPermission, Role } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendEmail, invitationEmail } from "@/server/services/email";

export const usersRouter = createTRPCRouter({
  // Get all users (ADMIN only)
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:read")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view users",
        });
      }

      const { limit, cursor } = input;

      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          emailVerified: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  // Get single user (ADMIN only)
  getById: protectedProcedure
    .input(userIdSchema)
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:read")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view users",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          emailVerified: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Create user (ADMIN only) - sends invitation email
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:create")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create users",
        });
      }

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Create user without password (will be set via invitation)
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          // No password - user will set it via invitation link
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
      });

      // Generate invitation token
      const invitationToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store invitation token
      await ctx.prisma.verificationToken.create({
        data: {
          identifier: input.email,
          token: invitationToken,
          expires,
        },
      });

      // Send invitation email
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const inviteUrl = `${baseUrl}/auth/setup-password?token=${invitationToken}&email=${encodeURIComponent(input.email)}`;

      try {
        await sendEmail({
          to: input.email,
          subject: "You've been invited to join the platform",
          html: invitationEmail({
            url: inviteUrl,
            inviterName: ctx.session.user.name || undefined,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't throw - user is created, they can request a new invitation
      }

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "CREATE",
          entity: "User",
          entityId: user.id,
          changes: {
            email: input.email,
            name: input.name,
            role: input.role,
          },
        },
      });

      return user;
    }),

  // Update user (ADMIN only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateUserSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:update")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update users",
        });
      }

      // Prepare update data
      const updateData: any = {
        ...input.data,
      };

      // Hash password if provided
      if (input.data.password) {
        updateData.password = await bcrypt.hash(input.data.password, 12);
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          updatedAt: true,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "UPDATE",
          entity: "User",
          entityId: user.id,
          changes: input.data,
        },
      });

      return user;
    }),

  // Delete user (ADMIN only)
  delete: protectedProcedure
    .input(userIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:delete")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete users",
        });
      }

      // Prevent deleting yourself
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      const user = await ctx.prisma.user.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "DELETE",
          entity: "User",
          entityId: user.id,
        },
      });

      return user;
    }),

  // Toggle 2FA (ADMIN only for other users)
  toggle2FA: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "users:update")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage 2FA",
        });
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          twoFactorEnabled: input.enabled,
          // Clear 2FA secret if disabling
          twoFactorSecret: input.enabled ? undefined : null,
        },
        select: {
          id: true,
          email: true,
          twoFactorEnabled: true,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "UPDATE",
          entity: "User",
          entityId: user.id,
          changes: {
            twoFactorEnabled: input.enabled,
          },
        },
      });

      return user;
    }),
});
