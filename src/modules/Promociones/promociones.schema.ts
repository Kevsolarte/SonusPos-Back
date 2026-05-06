import { z } from "zod";

export const createPromocionSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio").max(100),
    descripcion: z.string().optional(),
    tipo: z.enum(["PORCENTAJE", "PRECIO_FIJO"]),
    valor: z.number().positive("El valor debe ser positivo"),
    fechaInicio: z.string().transform((str) => new Date(str)),
    fechaFin: z.string().transform((str) => new Date(str)),
    activa: z.boolean().optional().default(true),
    productosIds: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un producto")
});

export const updatePromocionSchema = createPromocionSchema.partial();

export type createPromocionType = z.infer<typeof createPromocionSchema>;
export type updatePromocionType = z.infer<typeof updatePromocionSchema>;
