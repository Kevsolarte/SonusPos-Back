import { prisma } from "../../config/db.config.js";
import argon2 from "argon2";
import { loginSchema } from "./auth.schema.js";
import { signAccessToken } from "./auth.jwt.js";
import crypto from "crypto";
import { createAdminSchema } from "./auth.schema.js";
import { Prisma } from "@prisma/client";
function generateTempPassword() {
    return crypto.randomBytes(12).toString("base64url"); // ~16 chars
}
export const authService = {
    async createAdmin(dto) {
        const data = createAdminSchema.parse(dto);
        const plainPassword = data.password ?? generateTempPassword();
        const passwordHash = await argon2.hash(plainPassword);
        try {
            const user = await prisma.user.create({
                data: {
                    name: data.name.trim(),
                    email: data.email.toLowerCase().trim(),
                    role: "ADMIN",
                    passwordHash,
                },
                select: { id: true, name: true, email: true, role: true, createdAt: true, negocioId: true },
            });
            // Si tú NO mandaste password, te devuelvo la temporal para que la copies y se la des al usuario
            const credentials = data.password ? { email: user.email } : { email: user.email, tempPassword: plainPassword };
            return { user, credentials };
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new Error("Ese email ya existe");
            }
            throw e;
        }
    },
    async login(dto) {
        const data = loginSchema.parse(dto);
        const user = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase().trim() },
            select: { id: true, name: true, email: true, role: true, passwordHash: true, negocioId: true },
        });
        if (!user)
            throw new Error("Credenciales inválidas");
        const ok = await argon2.verify(user.passwordHash, data.password);
        if (!ok)
            throw new Error("Credenciales inválidas");
        // Nota: El SuperAdmin podría no tener negocioId inicialmente. 
        // En un SaaS real, le asignaríamos uno o tendría acceso global.
        const accessToken = signAccessToken(user.id, user.role, user.negocioId || "");
        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, negocioId: user.negocioId },
            accessToken,
        };
    },
};
//# sourceMappingURL=auth.service.js.map