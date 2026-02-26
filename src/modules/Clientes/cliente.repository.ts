import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const clienteRepository = {
    async create(negocioId: string, data: Prisma.ClienteCreateManyInput) {
        return await prisma.cliente.create({
            data: {
                ...data,
                negocioId,
            },
        });
    },

    async update(id: string, negocioId: string, data: Prisma.ClienteUpdateInput) {
        return await prisma.cliente.update({
            where: { id, negocioId },
            data,
        });
    },

    async delete(id: string, negocioId: string) {
        return await prisma.cliente.delete({
            where: { id, negocioId },
        });
    },

    async findById(id: string, negocioId: string) {
        return await prisma.cliente.findFirst({
            where: { id, negocioId },
        });
    },

    async findAll(negocioId: string, page = 1, limit = 50, search?: string) {
        const where: Prisma.ClienteWhereInput = { negocioId };

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

    async findByDocumento(documento: string, negocioId: string) {
        return await prisma.cliente.findFirst({
            where: { documento, negocioId },
        });
    },
};
