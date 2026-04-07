import { prisma } from "../../config/db.config.js";
import { type createClienteType, type updateClienteType } from "./cliente.schema.js";

export const clienteRepository = {
    async create(negocioId: string, data: createClienteType) {
        return await prisma.cliente.create({
            data: {
                negocioId,
                nombre: data.nombre,
                documento: data.documento,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion,
            },
        });
    },

    async update(id: string, negocioId: string, data: updateClienteType) {
        return await prisma.cliente.update({
            where: { id, negocioId },
            data: {
                nombre: data.nombre,
                documento: data.documento,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion,
            }
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
        const where: any = { negocioId };

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
