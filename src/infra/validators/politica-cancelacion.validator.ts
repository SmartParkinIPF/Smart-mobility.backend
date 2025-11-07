import { z } from "zod";

export const createPoliticaCancelacionSchema = z.object({
  descripcion_corta: z.string().min(1).optional().nullable(),
  reglas_json: z.any(),
  created_by: z.string().uuid(),
});

export const updatePoliticaCancelacionSchema =
  createPoliticaCancelacionSchema.partial();
