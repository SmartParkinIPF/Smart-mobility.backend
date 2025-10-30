import { z } from "zod";

export const createReservaSchema = z
  .object({
    slot_id: z.string().uuid().nullable().optional(),
    desde: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
    hasta: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
    precio_total: z.number().nullable().optional(),
    moneda: z.string().length(3).optional().default("ARS"),
    origen: z.string().optional().default("web"),
  })
  .refine((data) => data.hasta > data.desde, {
    message: "hasta debe ser mayor que desde",
    path: ["hasta"],
  });

export const updateReservaSchema = z
  .object({
    slot_id: z.string().uuid().nullable().optional(),
    desde: z
      .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date())
      .optional(),
    hasta: z
      .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date())
      .optional(),
    estado: z.string().optional(),
    precio_total: z.number().nullable().optional(),
    moneda: z.string().length(3).optional(),
    origen: z.string().optional(),
    codigo_qr: z.string().nullable().optional(),
  })
  .refine((data) => {
    if (data.desde && data.hasta) return data.hasta > data.desde;
    return true;
  }, {
    message: "hasta debe ser mayor que desde",
    path: ["hasta"],
  });

export const confirmReservaSchema = z.object({
  slot_id: z.string().uuid().optional(),
});

