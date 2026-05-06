import { prisma } from "../../config/db.config.js";
import { Prisma, EstadoCierre } from "@prisma/client";

export const cierresRepository = {
    async getActiveCierre(userId: string, negocioId: string) {
        return await prisma.cierre.findFirst({
            where: {
                userId,
                negocioId,
                estado: "ABIERTO"
            }
        });
    },

    async abrirCierre(data: { negocioId: string; userId: string; montoApertura: number }) {
        return await prisma.cierre.create({
            data: {
                negocioId: data.negocioId,
                userId: data.userId,
                montoApertura: new Prisma.Decimal(data.montoApertura),
                totalVentas: 0,
                cantVentas: 0,
                estado: "ABIERTO"
            }
        });
    },

    async getVentasForCierre(cierreId: string) {
        return await prisma.venta.findMany({
            where: {
                cierreId,
                estado: "PAGADA"
            },
            include: { pagos: true }
        });
    },

    async cerrarCajaTransaction(id: string, data: {
        totalVentas: Prisma.Decimal;
        cantVentas: number;
        detallePagos: any;
        montoCierreReal: number;
        diferencia: Prisma.Decimal;
        ventaIds: string[];
    }) {
        return await prisma.$transaction(async (tx) => {
            const cierre = await tx.cierre.update({
                where: { id },
                data: {
                    totalVentas: data.totalVentas,
                    cantVentas: data.cantVentas,
                    detallePagos: data.detallePagos,
                    montoCierreReal: new Prisma.Decimal(data.montoCierreReal),
                    diferencia: data.diferencia,
                    estado: "PENDIENTE",
                    fechaCierre: new Date()
                }
            });

            await tx.venta.updateMany({
                where: { id: { in: data.ventaIds } },
                data: { cierreId: cierre.id }
            });

            return cierre;
        });
    },

    async verificarCierre(id: string, data: { estado: EstadoCierre; auditadoPor: string; notasAuditoria?: string }) {
        return await prisma.cierre.update({
            where: { id },
            data: {
                estado: data.estado,
                auditadoPor: data.auditadoPor,
                notasAuditoria: data.notasAuditoria ?? null
            }
        });
    },

    async getHistory(negocioId: string, skip: number, take: number, filters: any = {}) {
        const where = { negocioId, ...filters };
        const [cierres, total] = await Promise.all([
            prisma.cierre.findMany({
                where,
                include: { 
                    user: { select: { name: true, permissions: true } }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take
            }),
            prisma.cierre.count({ where })
        ]);
        return { cierres, total };
    },

    async getVentasByCierre(cierreId: string, skip: number, take: number) {
        const [ventas, total] = await Promise.all([
            prisma.venta.findMany({
                where: { cierreId },
                include: {
                    pagos: true,
                    cliente: { select: { nombre: true } }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take
            }),
            prisma.venta.count({ where: { cierreId } })
        ]);
        return { ventas, total };
    }
};
