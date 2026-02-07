import { z } from "zod";

export const createVehicleSchema = z.object({
  make: z.string().min(1, "Make is required").max(100).trim(),
  model: z.string().min(1, "Model is required").max(100).trim(),
  year: z
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(
      new Date().getFullYear() + 1,
      `Year cannot be more than ${new Date().getFullYear() + 1}`
    ),
  price: z.number().positive("Price must be positive"),
  mileage: z.number().nonnegative("Mileage cannot be negative"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters")
    .trim(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(20, "Maximum 20 images allowed"),
  status: z.enum(["AVAILABLE", "SOLD", "RESERVED"]),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleIdSchema = z.object({
  id: z.string().cuid("Invalid vehicle ID"),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleIdInput = z.infer<typeof vehicleIdSchema>;
