import { z } from "zod";
export const CreateProveedorSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    documento: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),
});
export const UpdateProveedorSchema = CreateProveedorSchema.extend({
    activo: z.boolean().optional(),
}).partial();
//# sourceMappingURL=proveedor.schema.js.map