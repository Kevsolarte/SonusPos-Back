import { cierresRepository } from "./cierres.repository.js";
import { 
    abrirCierreSchema, 
    cerrarCierreSchema, 
    verificarCierreSchema,
    type abrirCierreType,
    type cerrarCierreType,
    type verificarCierreType 
} from "./cierres.schema.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware.js";

export const cierresService = {
    async getStatus(userId: string, negocioId: string) {
        const activeCierre = await cierresRepository.getActiveCierre(userId, negocioId);
        
        if (!activeCierre) {
            return { isOpen: false };
        }

        const ventas = await cierresRepository.getVentasForCierre(activeCierre.id);
        const totalVentasUSD = ventas.reduce((acc, v) => acc.plus(v.total), new Prisma.Decimal(0));
        
        const porMetodo: Record<string, number> = {};
        ventas.forEach((v) => {
            v.pagos?.forEach((p) => {
                const m = p.metodo.toString();
                porMetodo[m] = (porMetodo[m] || 0) + Number(p.montoBase || 0);
            });
        });

        return {
            isOpen: true,
            cierre: activeCierre,
            stats: {
                cantVentas: ventas.length,
                totalUSD: totalVentasUSD.toNumber(),
                desglose: porMetodo
            }
        };
    },

    async abrirCaja(userId: string, negocioId: string, dto: abrirCierreType) {
        const data = abrirCierreSchema.parse(dto);
        
        const active = await cierresRepository.getActiveCierre(userId, negocioId);
        if (active) {
            throw new AppError("Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.");
        }

        return await cierresRepository.abrirCierre({
            negocioId,
            userId,
            montoApertura: data.montoApertura
        });
    },

    async cerrarCaja(userId: string, negocioId: string, dto: cerrarCierreType) {
        const data = cerrarCierreSchema.parse(dto);
        const active = await cierresRepository.getActiveCierre(userId, negocioId);

        if (!active) {
            throw new AppError("No hay una caja abierta para cerrar.");
        }

        const ventas = await cierresRepository.getVentasForCierre(active.id);
        
        let totalVentasUSD = new Prisma.Decimal(0);
        const desglosePagos: Record<string, number> = {};

        for (const venta of ventas) {
            totalVentasUSD = totalVentasUSD.plus(venta.total);
            for (const pago of venta.pagos) {
                const m = pago.metodo.toString();
                desglosePagos[m] = (desglosePagos[m] || 0) + Number(pago.montoBase || 0);
            }
        }

        // Diferencia = Monto Real - (Apertura + Total Ventas)
        const esperado = new Prisma.Decimal(active.montoApertura).plus(totalVentasUSD);
        const diferencia = new Prisma.Decimal(data.montoCierreReal).minus(esperado);

        return await cierresRepository.cerrarCajaTransaction(active.id, {
            totalVentas: totalVentasUSD,
            cantVentas: ventas.length,
            detallePagos: desglosePagos,
            montoCierreReal: data.montoCierreReal,
            diferencia,
            ventaIds: ventas.map(v => v.id)
        });
    },

    async verificarCierre(adminId: string, cierreId: string, dto: verificarCierreType) {
        const data = verificarCierreSchema.parse(dto);
        return await cierresRepository.verificarCierre(cierreId, {
            estado: data.estado,
            auditadoPor: adminId,
            ...(data.notasAuditoria !== undefined && { notasAuditoria: data.notasAuditoria })
        });
    },

    async getHistory(negocioId: string, page = 1, limit = 20, status?: string) {
        const skip = (page - 1) * limit;
        const filters: any = {};
        if (status) filters.estado = status;

        const { cierres, total } = await cierresRepository.getHistory(negocioId, skip, limit, filters);

        return {
            cierres,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    async getVentasByCierre(cierreId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const { ventas, total } = await cierresRepository.getVentasByCierre(cierreId, skip, limit);
        
        return {
            ventas,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};
