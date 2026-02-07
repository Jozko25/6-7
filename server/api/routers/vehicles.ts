import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdSchema,
} from "@/lib/validators/vehicle";
import { hasPermission, Role } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

export const vehiclesRouter = createTRPCRouter({
  // Public: Get all vehicles
  getAll: publicProcedure
    .input(
      z.object({
        status: z.enum(["AVAILABLE", "SOLD", "RESERVED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, limit, cursor } = input;

      const vehicles = await ctx.prisma.vehicle.findMany({
        take: limit + 1,
        where: status ? { status } : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (vehicles.length > limit) {
        const nextItem = vehicles.pop();
        nextCursor = nextItem!.id;
      }

      return {
        vehicles,
        nextCursor,
      };
    }),

  // Public: Get single vehicle
  getById: publicProcedure
    .input(vehicleIdSchema)
    .query(async ({ ctx, input }) => {
      const vehicle = await ctx.prisma.vehicle.findUnique({
        where: { id: input.id },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      return vehicle;
    }),

  // Protected: Create vehicle (ADMIN or MANAGER)
  create: protectedProcedure
    .input(createVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "vehicles:create")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create vehicles",
        });
      }

      const vehicle = await ctx.prisma.vehicle.create({
        data: input,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "CREATE",
          entity: "Vehicle",
          entityId: vehicle.id,
          changes: input,
        },
      });

      return vehicle;
    }),

  // Protected: Update vehicle (ADMIN or MANAGER)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateVehicleSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "vehicles:update")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update vehicles",
        });
      }

      const vehicle = await ctx.prisma.vehicle.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "UPDATE",
          entity: "Vehicle",
          entityId: vehicle.id,
          changes: input.data,
        },
      });

      return vehicle;
    }),

  // Protected: Delete vehicle (ADMIN or MANAGER)
  delete: protectedProcedure
    .input(vehicleIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as Role;

      if (!hasPermission(userRole, "vehicles:delete")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete vehicles",
        });
      }

      const vehicle = await ctx.prisma.vehicle.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id as string,
          action: "DELETE",
          entity: "Vehicle",
          entityId: vehicle.id,
        },
      });

      return vehicle;
    }),
});
