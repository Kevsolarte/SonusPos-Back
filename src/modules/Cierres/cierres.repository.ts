import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";

export const cierresRepository = {
    async getVentasForCierre(negocioId: string) {
        return await prisma.venta.findMany({
            where: {
                negocioId,
                estado: "PAGADA",
                cierreId: null
            },
            include: { pagos: true }
        });
    },

    async createCierreTransaction(data: {
        negocioId: string;
        userId: string;
        totalVentas: Prisma.Decimal;
        cantVentas: number;
        detallePagos: any;
        ventaIds: string[];
    }) {
        return await prisma.$transaction(async (tx) => {
            const cierre = await tx.cierre.create({
                data: {
                    negocioId: data.negocioId,
                    userId: data.userId,
                    totalVentas: data.totalVentas,
                    cantVentas: data.cantVentas,
                    detallePagos: data.detallePagos
                }
            });

            await tx.venta.updateMany({
                where: { id: { in: data.ventaIds } },
                data: { cierreId: cierre.id }
            });

            return cierre;
        });
    },

    async getHistory(negocioId: string, skip: number, take: number) {
        const [cierres, total] = await Promise.all([
            prisma.cierre.findMany({
                where: { negocioId },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                skip,
                take
            }),
            prisma.cierre.count({ where: { negocioId } })
        ]);
        return { cierres, total };
    }
};
