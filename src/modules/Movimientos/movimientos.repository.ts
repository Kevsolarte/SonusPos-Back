import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const movimientosRepository = {
    async findProducto(id: string, negocioId: string) {
        return await prisma.producto.findFirst({
            where: { id, negocioId },
            include: { inventario: true }
        });
    },

    async createMovimientoManual(data: {
        negocioId: string;
        productoId: string;
        tipo: 'ENTRADA' | 'SALIDA' | 'MERMA' | 'AJUSTE';
        cantidad: Prisma.Decimal;
        motivo: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Crear movimiento
            const mov = await tx.movimientoInventario.create({
                data: {
                    negocioId: data.negocioId,
                    productoId: data.productoId,
                    tipo: data.tipo,
                    cantidad: data.cantidad,
                    motivo: data.motivo
                }
            });

            // 2. Actualizar inventario
            if (data.tipo === 'ENTRADA' || data.tipo === 'AJUSTE') {
                await tx.inventario.update({
                    where: { productoId: data.productoId },
                    data: { stockActual: { increment: data.cantidad } }
                });
            } else if (data.tipo === 'SALIDA' || data.tipo === 'MERMA') {
                await tx.inventario.update({
                    where: { productoId: data.productoId },
                    data: { stockActual: { decrement: data.cantidad } }
                });
            }

            return mov;
        });
    },

    async getMovimientos(negocioId: string, where: any, skip: number, take: number) {
        const [movimientos, total] = await Promise.all([
            prisma.movimientoInventario.findMany({
                where: { ...where, negocioId },
                include: { producto: { select: { nombre: true, codigoBarra: true } } },
                orderBy: { createdAt: "desc" },
                skip,
                take
            }),
            prisma.movimientoInventario.count({ where: { ...where, negocioId } })
        ]);

        return { movimientos, total };
    }
};
