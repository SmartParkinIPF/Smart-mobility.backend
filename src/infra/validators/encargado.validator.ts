import { z } from "zod";

export const createEncargadoSchema = z
  .object({
    existingUserId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.number().int().optional(),
    email: z.email().optional(),
    password: z.string().min(6).optional(),
  })
  .superRefine((data, ctx) => {
    const wantsExisting = Boolean(data.existingUserId);
    const hasNewUserFields =
      data.name !== undefined &&
      data.lastName !== undefined &&
      data.phone !== undefined &&
      data.email !== undefined &&
      data.password !== undefined;
    if (!wantsExisting && !hasNewUserFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Debes enviar existingUserId o los campos name, lastName, phone, email y password para crear al encargado.",
        path: ["existingUserId"],
      });
    }
    if (wantsExisting && hasNewUserFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No puedes enviar existingUserId y datos de creacion al mismo tiempo. Usa solo una modalidad.",
        path: ["existingUserId"],
      });
    }
  });

export const updateEncargadoSchema = z
  .object({
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
