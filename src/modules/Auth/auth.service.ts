import { authRepository } from "./auth.repository.js";
import argon2 from "argon2";
import { loginSchema, createAdminSchema, registerAdminSchema, type loginSchemaType, type createAdminSchemaType, type registerAdminSchemaType } from "./auth.schema.js";
import { signAccessToken, signRecoveryToken, verifyRecoveryToken } from "./auth.jwt.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.config.js";
import { tasaService } from "../Tasas/tasas.service.js";
import { emailService } from "../../services/email.service.js";

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

        // Dejamos que inicie sesión siempre, las restricciones se manejan en el middleware y el frontend

        // VALIDACIÓN DE SEGURIDAD: Estado del Negocio
        if (user.role !== 'SUPERADMIN' && user.negocioId) {
            const negocio = await authRepository.findNegocioById(user.negocioId);
            if (negocio && !negocio.activo) {
                throw new Error("El acceso a este negocio ha sido suspendido por el administrador del sistema.");
            }
        }

        const accessToken = signAccessToken(user.id, user.role, user.negocioId || "", user.permissions);
        const userFull = await authRepository.findByIdWithNegocio(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                negocioId: user.negocioId,
                activo: user.activo,
                permissions: user.permissions,
                negocio: userFull?.negocio || null
            },
            accessToken,
        };
    },

    /**
     * Registro público para dueños de negocio (role ADMIN).
     * Crea el Negocio y el User en un solo paso atómico.
     */
    async registerAdmin(dto: registerAdminSchemaType) {
        const data = registerAdminSchema.parse(dto);
        const passwordHash = await argon2.hash(data.password);

        try {
            const { user, negocio } = await authRepository.registerAdmin({
                name: data.name,
                email: data.email,
                passwordHash,
                negocioNombre: data.negocioNombre,
                ...(data.negocioRuc !== undefined && { negocioRuc: data.negocioRuc }),
                ...(data.negocioDireccion !== undefined && { negocioDireccion: data.negocioDireccion }),
                ...(data.negocioTelefono !== undefined && { negocioTelefono: data.negocioTelefono }),
            });

            // Sincronizar tasas oficiales inmediatamente al registrar
            await tasaService.getAll(negocio.id);

            // Enviar email de bienvenida
            emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
                console.error("❌ Error enviando email de bienvenida:", err);
            });

            const accessToken = signAccessToken(user.id, user.role, negocio.id, user.permissions);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    negocioId: negocio.id,
                    activo: true, // Nuevo administrador es activo por defecto
                    permissions: user.permissions,
                    negocio,
                },
                accessToken,
            };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new Error("Ese email o RUC ya está registrado");
            }
            throw e;
        }
    },

    async getMe(id: string) {
        const userFull = await authRepository.findByIdWithNegocio(id);
        if (!userFull) throw new Error("Usuario no encontrado");

        return {
            id: userFull.id,
            name: userFull.name,
            email: userFull.email,
            role: userFull.role,
            negocioId: userFull.negocioId,
            activo: userFull.activo,
            permissions: userFull.permissions,
            negocio: userFull.negocio
        };
    },

    async forgotPassword(email: string) {
        const user = await authRepository.findByEmail(email);
        if (!user) return; // Por seguridad no revelamos si existe o no

        const token = signRecoveryToken(user.id);
        await emailService.sendRecoveryEmail(user.email, token);
    },

    async resetPassword(token: string, newPassword: string) {
        const payload = verifyRecoveryToken(token);
        const passwordHash = await argon2.hash(newPassword);

        await prisma.user.update({
            where: { id: payload.sub },
            data: { passwordHash }
        });
    }
};
