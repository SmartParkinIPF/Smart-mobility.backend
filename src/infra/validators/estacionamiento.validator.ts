import { z } from "zod";
import {
  geoPointSchema,
  geoPolygonSchema,
} from "./establecimiento.validator";

export const createEstacionamientoSchema = z.object({
  establecimiento_id: z.string().uuid(),
  nombre: z.string().min(1),
  tipo: z.string().min(1),
  soporta_discapacidad: z.boolean(),
  soporta_motos: z.boolean(),
  soporta_electricos: z.boolean(),
  tiene_cargadores: z.boolean(),
  cantidad_cargadores: z.number().int().nonnegative(),
  tarifa_id: z.string().uuid(),
  horario_id: z.string().uuid(),
  politica_cancelacion_id: z.string().uuid(),
  estado: z.string().optional().default("activo"),
  ubicacion: geoPointSchema,
  perimetro_est: geoPolygonSchema,
});

export const updateEstacionamientoSchema = z.object({
  nombre: z.string().min(1).optional(),
  tipo: z.string().min(1).optional(),
  soporta_discapacidad: z.boolean().optional(),
  soporta_motos: z.boolean().optional(),
  soporta_electricos: z.boolean().optional(),
  tiene_cargadores: z.boolean().optional(),
  cantidad_cargadores: z.number().int().nonnegative().optional(),
  tarifa_id: z.string().uuid().optional(),
  horario_id: z.string().uuid().optional(),
  politica_cancelacion_id: z.string().uuid().optional(),
  estado: z.string().optional(),
  ubicacion: geoPointSchema.optional(),
  perimetro_est: geoPolygonSchema.optional(),
});
