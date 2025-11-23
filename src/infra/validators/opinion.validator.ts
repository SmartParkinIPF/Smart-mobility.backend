import { z } from "zod";

export const createOpinionSchema = z.object({
  establecimiento_id: z.string().uuid({ message: "establecimiento_id debe ser UUID" }),
  rating: z
    .number()
    .int({ message: "rating debe ser entero" })
    .min(1, { message: "rating minimo 1" })
    .max(5, { message: "rating maximo 5" }),
  comentario: z.string().max(2000).optional().nullable(),
});

export const updateOpinionSchema = z
  .object({
    rating: z
      .number()
      .int({ message: "rating debe ser entero" })
      .min(1, { message: "rating minimo 1" })
      .max(5, { message: "rating maximo 5" })
      .optional(),
    comentario: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => data.rating !== undefined || data.comentario !== undefined, {
    message: "Enviar al menos un campo para actualizar",
    path: ["rating"],
  });
