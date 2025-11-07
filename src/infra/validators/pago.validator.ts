import { z } from "zod";

export const createPagoSchema = z.object({
  reserva_id: z.string().uuid({ message: "reserva_id debe ser UUID" }),
  monto: z.number().positive({ message: "monto debe ser positivo" }),
  moneda: z
    .string()
    .length(3, { message: "moneda debe tener 3 caracteres" })
    .optional()
    .default("ARS"),
  metodo: z.string().optional().default("mercado_pago"),
  descripcion: z.string().optional(),
  back_urls: z
    .object({
      success: z.string().url().optional(),
      pending: z.string().url().optional(),
      failure: z.string().url().optional(),
    })
    .optional(),
});

export const updatePagoEstadoSchema = z.object({
  estado: z.string(),
  proveedor_tx_id: z.string().nullable().optional(),
  recibo_url: z.string().url().nullable().optional(),
});

