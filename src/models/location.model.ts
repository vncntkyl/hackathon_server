import z from "zod";

export const UserLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  barangay: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
});

export type UserLocation = z.infer<typeof UserLocationSchema>;
