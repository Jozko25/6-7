import { createTRPCRouter } from "@/server/api/trpc";
import { vehiclesRouter } from "@/server/api/routers/vehicles";
import { authRouter } from "@/server/api/routers/auth";
import { uploadsRouter } from "@/server/api/routers/uploads";
import { usersRouter } from "@/server/api/routers/users";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  vehicles: vehiclesRouter,
  uploads: uploadsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
