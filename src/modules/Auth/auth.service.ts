import { authRepository } from "./auth.repository.js";
import argon2 from "argon2";
import { loginSchema, createAdminSchema, type loginSchemaType, type createAdminSchemaType } from "./auth.schema.js";
import { signAccessToken } from "./auth.jwt.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

function generateTempPassword() {
    return crypto.randomBytes(12).toString("base64url");
}

export const authService = {
    async createAdmin(dto: createAdminSchemaType) {
        const data = createAdminSchema.parse(dto);
        const plainPassword = data.password ?? generateTempPassword();
        const passwordHash = await argon2.hash(plainPassword);

        try {
            const user = await authRepository.createAdminInstance({
                name: data.name,
                email: data.email,
                passwordHash
            });

            const credentials = data.password 
                ? { email: user.email } 
                : { email: user.email, tempPassword: plainPassword };

            return { user, credentials };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new Error("Ese email ya existe");
            }
            throw e;
        }
    },

    async login(dto: loginSchemaType) {
        const data = loginSchema.parse(dto);
        const user = await authRepository.findByEmail(data.email);

        if (!user) throw new Error("Credenciales inválidas");

        const ok = await argon2.verify(user.passwordHash, data.password);
        if (!ok) throw new Error("Credenciales inválidas");

        const accessToken = signAccessToken(user.id, user.role, user.negocioId || "");
        const userFull = await authRepository.findByIdWithNegocio(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                negocioId: user.negocioId,
                negocio: userFull?.negocio || null
            },
            accessToken,
        };
    },
};
