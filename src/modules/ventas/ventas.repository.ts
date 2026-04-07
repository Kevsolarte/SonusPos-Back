import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.config.js";

export const ventasRepository = {
    async findProductsForVenta(negocioId: string, productIds: string[]) {
        return await prisma.producto.findMany({
            where: {
                id: { in: productIds },
                negocioId
            },
            include: { precio: true }
        });
    },

    async saveVenta(tx: Prisma.TransactionClient, data: any) {
        return await tx.venta.create({
            data,
            include: { pagos: true, detalles: true }
        });
    },

    async updateStock(tx: Prisma.TransactionClient, productoId: string, cantidad: Prisma.Decimal) {
        return await tx.inventario.update({
            where: { productoId },
            data: {
                stockActual: {
                    decrement: cantidad
                }
            }
        });
    },

    async createMovimiento(tx: Prisma.TransactionClient, data: { 
        negocioId: string, 
        productoId: string, 
        tipo: 'ENTRADA' | 'SALIDA' | 'MERMA' | 'AJUSTE', 
        cantidad: Prisma.Decimal, 
        motivo: string 
    }) {
        return await tx.movimientoInventario.create({
            data: {
                negocioId: data.negocioId,
                productoId: data.productoId,
                tipo: data.tipo,
                cantidad: data.cantidad,
                motivo: data.motivo
            }
        });
    }
};
