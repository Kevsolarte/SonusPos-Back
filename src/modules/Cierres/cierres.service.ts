import { cierresRepository } from "./cierres.repository.js";
import { createCierreSchema, type createCierreType } from "./cierres.schema.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";

export const cierresService = {
    /**
     * Obtiene ventas pendientes para mostrar resumen antes del cierre
     */
    async getVentasPendientes(negocioId: string) {
        const ventas = await cierresRepository.getVentasForCierre(negocioId);
        
        const totalUSD = ventas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));
        const porMetodo: Record<string, number> = {};
        
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
            generatedAt: new Date()
        };
    },

    async createCierre(userId: string, negocioId: string, dto: createCierreType) {
        const data = createCierreSchema.parse(dto);

        const ventas = await cierresRepository.getVentasForCierre(negocioId);

        if (ventas.length === 0) {
            throw new AppError("No hay ventas pendientes para realizar un cierre.");
        }

        let totalVentas = new Prisma.Decimal(0);
        const desglosePagos: Record<string, number> = {};

        for (const venta of ventas) {
            totalVentas = totalVentas.plus(venta.total);
            for (const pago of venta.pagos) {
                const m = pago.metodo.toString();
                desglosePagos[m] = (desglosePagos[m] || 0) + Number(pago.monto);
            }
        }

        return await cierresRepository.createCierreTransaction({
            negocioId,
            userId,
            totalVentas,
            cantVentas: ventas.length,
            detallePagos: desglosePagos,
            ventaIds: ventas.map(v => v.id)
        });
    },

    async getHistory(negocioId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const { cierres, total } = await cierresRepository.getHistory(negocioId, skip, limit);

        return {
            cierres,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};
