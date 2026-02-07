export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  VIEWER = "VIEWER",
}

export const permissions = {
  [Role.ADMIN]: [
    "vehicles:create",
    "vehicles:read",
    "vehicles:update",
    "vehicles:delete",
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "settings:update",
  ],
  [Role.MANAGER]: [
    "vehicles:create",
    "vehicles:read",
    "vehicles:update",
    "vehicles:delete",
  ],
  [Role.VIEWER]: ["vehicles:read"],
} as const;

export function hasPermission(
  role: Role,
  permission: string
): boolean {
  return permissions[role]?.includes(permission as any) ?? false;
}

export function requirePermission(permission: string) {
  return async (ctx: any) => {
    if (!ctx.session?.user) {
      throw new Error("Unauthorized");
    }

    if (!hasPermission(ctx.session.user.role as Role, permission)) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    return true;
  };
}
