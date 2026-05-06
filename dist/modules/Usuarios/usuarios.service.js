import { usuariosRepository } from "./usuarios.repository.js";
import { negocioRepository } from "../Negocio/negocio.repository.js";
import { createUserSchema, updateUserSchema } from "./usuarios.schema.js";
import argon2 from "argon2";
import { AppError } from "../../middlewares/error.middleware.js";
export const usuariosService = {
    async getUsuarios(negocioId) {
        return await usuariosRepository.findAll(negocioId);
    },
    async createUsuario(negocioId, dto) {
        const data = createUserSchema.parse(dto);
        // VALIDACIÓN DE LÍMITES (PLAN)
        const limits = await negocioRepository.getLimits(negocioId);
        if (limits && limits._count.users >= limits.limiteUsuarios) {
            throw new AppError(`Has alcanzado el límite de ${limits.limiteUsuarios} usuarios permitido por tu plan.`, 403);
        }
        const passwordHash = await argon2.hash(data.password);
        try {
            return await usuariosRepository.create(negocioId, { ...data, passwordHash });
        }
        catch (e) {
            if (e.code === "P2002")
                throw new AppError("El email ya está en uso", 400);
            throw e;
        }
    },
    async updateUsuario(id, negocioId, dto) {
        const data = updateUserSchema.parse(dto);
        let passwordHash;
        if (data.password) {
            passwordHash = await argon2.hash(data.password);
        }
        return await usuariosRepository.update(id, negocioId, {
            ...data,
            ...(passwordHash !== undefined && { passwordHash })
        });
    },
    async deleteUsuario(id, negocioId) {
        try {
            return await usuariosRepository.delete(id, negocioId);
        }
        catch (e) {
            if (e.code === "P2003") {
                throw new AppError("No se puede eliminar el usuario porque tiene historial registrado (cierres). Desactívalo en su lugar.", 400);
            }
            throw e;
        }
    },
};
//# sourceMappingURL=usuarios.service.js.map