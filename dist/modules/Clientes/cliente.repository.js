import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";
export const clienteRepository = {
    async create(negocioId, data) {
        return await prisma.cliente.create({
            data: {
                ...data,
                negocioId,
            },
        });
    },
    async update(id, negocioId, data) {
        return await prisma.cliente.update({
            where: { id, negocioId },
            data,
        });
    },
    async delete(id, negocioId) {
        return await prisma.cliente.delete({
            where: { id, negocioId },
        });
    },
    async findById(id, negocioId) {
        return await prisma.cliente.findFirst({
            where: { id, negocioId },
        });
    },
    async findAll(negocioId, page = 1, limit = 50, search) {
        const where = { negocioId };
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: "insensitive" } },
                { documento: { contains: search, mode: "insensitive" } },
            ];
        }
        const skip = (page - 1) * limit;
        const [clientes, total] = await Promise.all([
            prisma.cliente.findMany({
                where,
                skip,
                take: limit,
                orderBy: { nombre: "asc" },
            }),
            prisma.cliente.count({ where })
        ]);
        return {
            clientes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    },
    async findByDocumento(documento, negocioId) {
        return await prisma.cliente.findFirst({
            where: { documento, negocioId },
        });
    },
};
//# sourceMappingURL=cliente.repository.js.map