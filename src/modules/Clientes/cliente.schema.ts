import { z } from "zod";

export const createClienteSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    documento: z.string().min(1, "El documento/cédula es obligatorio"),
    telefono: z.string().optional().nullable()
        .transform(val => val === "" ? null : val),
    email: z.string().optional().nullable()
        .transform(val => val === "" ? null : val)
        .pipe(z.string().email("Email inválido").optional().nullable()),
    direccion: z.string().optional().nullable()
        .transform(val => val === "" ? null : val),
});

export const updateClienteSchema = createClienteSchema.partial();
