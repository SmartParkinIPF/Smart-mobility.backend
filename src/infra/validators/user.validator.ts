import { z } from "zod";

export const rolSchema = z.enum(["admin", "user", "provider"]);

export const registerSchema = z
  .object({
    name: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.number().int(),
    email: z.email(),
    password: z.string().min(6),
    role: rolSchema.optional().default("user"),
  })
  .superRefine((data, ctx) => {
    if (data.role === "admin") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No podes registrarte directamente como admin",
        path: ["role"],
      });
    }
  });

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const updateUserSchema = z
  .object({
    requesterId: z.string().uuid(),
    name: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.name === undefined &&
      data.lastName === undefined &&
      data.phone === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes enviar al menos un campo para actualizar",
        path: ["name"],
      });
    }
  });

export const deleteUserSchema = z.object({
  requesterId: z.string().uuid(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});
