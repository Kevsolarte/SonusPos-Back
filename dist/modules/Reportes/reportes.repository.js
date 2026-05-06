import { prisma } from "../../config/db.config.js";
import { Prisma } from "@prisma/client";
export const reportesRepository = {
    // Ventas agrupadas por fecha (para gráficos de línea)
    async getVentasTimeline(negocioId, startDate, endDate) {
        // Obtenemos todas las ventas en el rango
        const ventas = await prisma.venta.findMany({
            where: {
                negocioId,
                createdAt: { gte: startDate, lte: endDate },
                estado: { not: "ANULADA" },
            },
            select: {
                createdAt: true,
                total: true,
            },
            orderBy: { createdAt: "asc" }
        });
        return ventas;
    },
    // Distribución de métodos de pago consolidada
    async getMetodosPagoConsolidado(negocioId, startDate, endDate) {
        const pagos = await prisma.ventaPago.groupBy({
            by: ["metodo"],
            where: {
                venta: {
                    negocioId,
                    createdAt: { gte: startDate, lte: endDate },
                    estado: { not: "ANULADA" },
                },
            },
            _sum: {
                montoBase: true,
            },
        });
        return pagos.map(p => ({
            metodo: p.metodo,
            total: Number(p._sum.montoBase || 0),
        }));
    },
    // Reporte de Rentabilidad (Ventas vs Costos)
    async getRentabilidad(negocioId, startDate, endDate) {
        const detalles = await prisma.ventaDetalle.findMany({
            where: {
                venta: {
                    negocioId,
                    createdAt: { gte: startDate, lte: endDate },
                    estado: { not: "ANULADA" },
                },
            },
            include: {
                producto: {
                    select: {
                        nombre: true,
                        categoria: { select: { nombre: true } },
                        precio: { select: { preciocompra: true } }
                    }
                }
            }
        });
        return detalles;
    },
    // Top Clientes
    async getTopClientes(negocioId, startDate, endDate) {
        const result = await prisma.venta.groupBy({
            by: ["clienteId"],
            where: {
                negocioId,
                clienteId: { not: null },
                createdAt: { gte: startDate, lte: endDate },
                estado: { not: "ANULADA" },
            },
            _sum: { total: true },
            _count: { id: true },
            orderBy: { _sum: { total: "desc" } },
            take: 10
        });
        const clienteIds = result.map(r => r.clienteId);
        const clientes = await prisma.cliente.findMany({
            where: { id: { in: clienteIds } },
            select: { id: true, nombre: true }
        });
        return result.map(r => {
            const c = clientes.find(cl => cl.id === r.clienteId);
            return {
                nombre: c?.nombre || "Desconocido",
                totalInvertido: Number(r._sum.total || 0),
                cantidadCompras: r._count.id,
                promedioTicket: Number(r._sum.total || 0) / r._count.id
            };
        });
    }
};
//# sourceMappingURL=reportes.repository.js.map