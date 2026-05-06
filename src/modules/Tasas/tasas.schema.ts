import { z } from "zod";

export const createTasaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  moneda: z.enum(["USD", "VES", "BTC", "EUR", "COP", "OTHER"]),
  tasa: z.number().positive("La tasa debe ser mayor a 0"),
  isPrincipal: z.boolean().optional(),
});

export type CreateTasaDto = z.infer<typeof createTasaSchema>;

export const updateTasaSchema = createTasaSchema.partial();

export type UpdateTasaDto = z.infer<typeof updateTasaSchema>;
