import { prisma } from "../../config/db.config.js";
import {} from "./categorias.schema.js";
export const categoriasRepository = {
    async getAll(negocioId) {
        return await prisma.categoria.findMany({
            where: { negocioId },
            orderBy: { nombre: 'asc' },
            include: {
                _count: {
                    select: { productos: true }
                }
            }
        });
    },
    async getById(id, negocioId) {
        return await prisma.categoria.findFirst({
            where: { id, negocioId }
        });
    },
    async getByNameRaw(negocioId, nombre) {
        return await prisma.categoria.findFirst({
            where: { negocioId, nombre }
        });
    },
    async reactivate(id, negocioId) {
        return await prisma.categoria.update({
            where: { id, negocioId },
            data: { activo: true }
        });
    },
    async create(negocioId, data) {
        return await prisma.categoria.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion ?? null,
                negocioId
            }
        });
    },
    async update(id, negocioId, data) {
        return await prisma.categoria.update({
            where: { id, negocioId },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
                ...(data.activo !== undefined && { activo: data.activo })
            }
        });
    },
    async delete(id, negocioId) {
        // Soft delete
        return await prisma.categoria.update({
            where: { id, negocioId },
            data: { activo: false }
        });
    }
};
//# sourceMappingURL=categorias.repository.js.map