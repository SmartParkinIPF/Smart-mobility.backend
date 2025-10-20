import { z } from "zod";

const latSchema = z
  .number()
  .min(-90, "latitude debe ser >= -90")
  .max(90, "latitude debe ser <= 90");
const lngSchema = z
  .number()
  .min(-180, "longitude debe ser >= -180")
  .max(180, "longitude debe ser <= 180");

export const geoPointSchema = z.object({
  latitude: latSchema,
  longitude: lngSchema,
});

export const geoPolygonSchema = z
  .array(geoPointSchema)
  .min(4, "location debe tener al menos 4 puntos");

export const createEstablecimientoSchema = z.object({
  ownerId: z.string().uuid(),
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  direccion_calle: z.string().min(1),
  direccion_numero: z.string().min(1),
  ciudad: z.string().min(1),
  provincia: z.string().min(1),
  pais: z.string().min(1),
  cp: z.string().min(1),
  perimetro: geoPolygonSchema,
  localizacion: geoPointSchema,
  estado: z.string().optional().default("activo"),
  horario_general: z.any().optional(),
  capacidad_teorica: z.number().int().nonnegative(),
});

export const updateEstablecimientoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().min(1).optional(),
  direccion_calle: z.string().min(1).optional(),
  direccion_numero: z.string().min(1).optional(),
  ciudad: z.string().min(1).optional(),
  provincia: z.string().min(1).optional(),
  pais: z.string().min(1).optional(),
  cp: z.string().min(1).optional(),
  estado: z.string().optional(),
  horario_general: z.any().optional(),
  capacidad_teorica: z.number().int().nonnegative().optional(),
  localizacion: geoPointSchema.optional(),
  perimetro: geoPolygonSchema.optional(),
});
