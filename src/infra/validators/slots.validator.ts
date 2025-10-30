import { z } from "zod";
import { geoPolygonSchema } from "./establecimiento.validator";

export const createSlotSchema = z.object({
  estacionamiento_id: z.string().uuid(),
  codigo: z.string().min(1),
  tipo: z.string().min(1),
  ancho_cm: z.number().int().nonnegative(),
  largo_cm: z.number().int().nonnegative(),
  ubicacion_local: geoPolygonSchema, // jsonb libre; usamos polígono consistente
  estado_operativo: z.string().min(1),
  tarifa_id: z.string().uuid(),
  es_reservable: z.boolean(),
});

export const updateSlotSchema = z.object({
  codigo: z.string().min(1).optional(),
  tipo: z.string().min(1).optional(),
  ancho_cm: z.number().int().nonnegative().optional(),
  largo_cm: z.number().int().nonnegative().optional(),
  ubicacion_local: geoPolygonSchema.optional(),
  estado_operativo: z.string().min(1).optional(),
  tarifa_id: z.string().uuid().optional(),
  es_reservable: z.boolean().optional(),
});

