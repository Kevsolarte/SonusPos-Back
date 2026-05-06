import { prisma } from "../../config/db.config.js";
import {} from "./usuarios.schema.js";
import { saasGuard } from "../../utils/saasGuard.js";
export const usuariosRepository = {
    async findAll(negocioId) {
        return await prisma.user.findMany({
            where: { negocioId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activo: true,
                permissions: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async findById(id, negocioId) {
        return await prisma.user.findFirst({
            where: { id, negocioId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activo: true,
                permissions: true,
            },
        });
    },
    async create(negocioId, data) {
        await saasGuard.canCreateUser(negocioId);
        const { password, permissions, ...rest } = data;
        return await prisma.user.create({
            data: {
                ...rest,
                permissions: permissions || {},
                negocioId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activo: true,
                permissions: true,
            },
        });
    },
    async update(id, negocioId, data) {
        const { password, permissions, passwordHash, ...rest } = data;
        return await prisma.user.update({
            where: { id, negocioId },
            data: {
                ...(rest.name !== undefined && { name: rest.name }),
                ...(rest.email !== undefined && { email: rest.email }),
                ...(rest.role !== undefined && { role: rest.role }),
                ...(rest.activo !== undefined && { activo: rest.activo }),
                ...(permissions !== undefined && { permissions: permissions }),
                ...(passwordHash !== undefined && { passwordHash })
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activo: true,
                permissions: true,
            },
        });
    },
    async delete(id, negocioId) {
        return await prisma.user.delete({
            where: { id, negocioId },
        });
    },
};
//# sourceMappingURL=usuarios.repository.js.map