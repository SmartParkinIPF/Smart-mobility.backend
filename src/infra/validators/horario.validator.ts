import { z } from "zod";

export const createHorarioSchema = z.object({
  id_usuario: z.string().uuid(),
  tipo: z.string().min(1),
  definicion: z.string().min(1),
});

export const updateHorarioSchema = z.object({
  tipo: z.string().min(1).optional(),
  definicion: z.string().min(1).optional(),
});

