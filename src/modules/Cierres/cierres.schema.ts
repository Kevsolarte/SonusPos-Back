import { z } from "zod";

export const createCierreSchema = z.object({
    // Aunque calculamos los totales en backend, el usuario podría enviar lo que contó
    pagoContado: z.record(z.string(), z.number()).optional(),
});

export type createCierreType = z.infer<typeof createCierreSchema>;
