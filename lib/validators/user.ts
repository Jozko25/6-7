import { z } from "zod";

// For admin creating users - no password, will be set via invitation email
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
});

// For user setting their password via invitation link
export const setupPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const userIdSchema = z.object({
  id: z.string().cuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetupPasswordInput = z.infer<typeof setupPasswordSchema>;
