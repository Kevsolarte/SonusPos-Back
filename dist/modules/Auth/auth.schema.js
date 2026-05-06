import { z } from "zod";
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export const registerSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    passwordHash: z.string(),
});
export const createAdminSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).optional(),
});
// Registro público para dueños de negocio (role ADMIN)
export const registerAdminSchema = z.object({
    // Datos del usuario
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    // Datos del negocio
    negocioNombre: z.string().min(2, "El nombre del negocio es requerido"),
    negocioRuc: z.string().optional(),
    negocioDireccion: z.string().optional(),
    negocioTelefono: z.string().optional(),
});
//# sourceMappingURL=auth.schema.js.map