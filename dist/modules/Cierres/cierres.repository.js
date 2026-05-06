import { prisma } from "../../config/db.config.js";
import { Prisma, EstadoCierre } from "@prisma/client";
export const cierresRepository = {
    async getActiveCierre(userId, negocioId) {
        return await prisma.cierre.findFirst({
            where: {
                userId,
                negocioId,
                estado: "ABIERTO"
            }
        });
    },
    async abrirCierre(data) {
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
    async getVentasForCierre(cierreId) {
        return await prisma.venta.findMany({
            where: {
                cierreId,
                estado: "PAGADA"
            },
            include: { pagos: true }
        });
    },
    async cerrarCajaTransaction(id, data) {
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
    async verificarCierre(id, data) {
        return await prisma.cierre.update({
            where: { id },
            data: {
                estado: data.estado,
                auditadoPor: data.auditadoPor,
                notasAuditoria: data.notasAuditoria ?? null
            }
        });
    },
    async getHistory(negocioId, skip, take, filters = {}) {
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
    async getVentasByCierre(cierreId, skip, take) {
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
//# sourceMappingURL=cierres.repository.js.map