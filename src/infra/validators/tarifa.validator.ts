import { z } from "zod";

export const createTarifaSchema = z.object({
  nombre: z.string().min(1),
  moneda: z.string().length(3).optional().default("ARS"),
  modo_calculo: z.string().min(1),
  precio_base: z.number().nonnegative().optional().nullable(),
  precio_por_hora: z.number().nonnegative().optional().nullable(),
  fraccion_min: z.number().int().nonnegative().optional().nullable(),
  minimo_cobro_min: z.number().int().nonnegative().optional().nullable(),
  maximo_diario: z.number().nonnegative().optional().nullable(),
  reglas_json: z.any().optional().nullable(),
  vigencia_desde: z.coerce.date().optional().nullable(),
  vigencia_hasta: z.coerce.date().optional().nullable(),
});

export const updateTarifaSchema = createTarifaSchema.partial();

