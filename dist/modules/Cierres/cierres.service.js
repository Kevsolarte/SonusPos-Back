import { prisma } from "../../config/db.config.js";
import { AppError } from "../../middlewares/error.middleware.js";
import { Prisma } from "@prisma/client";
export const cierresService = {
    /**
     * Obtiene las ventas que aún no han sido cerradas
     */
    async getVentasPendientes(negocioId) {
        console.log("Consultando ventas pendientes para negocio:", negocioId);
        const ventas = await prisma.venta.findMany({
            where: {
                negocioId,
                cierreId: null,
                estado: "PAGADA",
            },
            include: {
                pagos: true,
            },
            orderBy: { createdAt: "asc" }
        });
        const firstVentaAt = ventas.length > 0 ? ventas[0]?.createdAt : null;
        console.log(`Encontradas ${ventas.length} ventas`);
        const totalUSD = ventas.reduce((acc, v) => acc.plus(new Prisma.Decimal(v.total)), new Prisma.Decimal(0));
        // Desglose por método
        const porMetodo = {};
        ventas.forEach((v) => {
            v.pagos?.forEach((p) => {
                const m = p.metodo.toString();
                porMetodo[m] = (porMetodo[m] || 0) + Number(p.monto);
            });
        });
        return {
            cantVentas: ventas.length,
            totalUSD: totalUSD.toNumber(),
            desglose: porMetodo,
            firstVentaAt,
            generatedAt: new Date()
        };
    },
    /**
     * Realiza el cierre de las ventas actuales
     */
    async ejecutarCierre(negocioId, userId) {
        const pendientes = await cierresService.getVentasPendientes(negocioId);
        if (pendientes.cantVentas === 0) {
            throw new AppError("No hay ventas pendientes para cerrar", 400);
        }
        return await prisma.$transaction(async (tx) => {
            // 1. Crear el registro del cierre
            const cierre = await tx.cierre.create({
                data: {
                    negocioId,
                    userId,
                    totalVentas: new Prisma.Decimal(pendientes.totalUSD),
                    cantVentas: pendientes.cantVentas,
                    detallePagos: pendientes.desglose,
                },
            });
            // 2. Vincular todas las ventas pendientes a este cierre
            await tx.venta.updateMany({
                where: {
                    negocioId,
                    cierreId: null,
                    estado: "PAGADA",
                },
                data: {
                    cierreId: cierre.id,
                },
            });
            return cierre;
        });
    },
    async getHistorialCierres(negocioId) {
        return await prisma.cierre.findMany({
            where: { negocioId },
            include: {
                user: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });
    }
};
//# sourceMappingURL=cierres.service.js.map