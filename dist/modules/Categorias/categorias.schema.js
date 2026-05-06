import { z } from "zod";
export const createCategoriaSchema = z.object({
    nombre: z.string().min(1, "El nombre de la categoría es obligatorio").max(50),
    descripcion: z.string().optional().nullable(),
    activo: z.boolean().optional(),
});
export const updateCategoriaSchema = createCategoriaSchema.partial();
//# sourceMappingURL=categorias.schema.js.map