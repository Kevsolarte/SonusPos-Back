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
    // opcional: si no la mandas, el sistema genera una temporal
    password: z.string().min(8).optional(),
});
//# sourceMappingURL=auth.schema.js.map