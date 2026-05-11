import { dashboardRepository } from "./dashboard.repository.js";
const dashboardCache = new Map();
const CACHE_TTL = 60_000; // 60 segundos
async function buildDashboardStats(negocioId) {
    const [totals, saldos, stockCritico, creditos, metodosPago, ventasPorHora, topProductos, topCobros, topDeudas, cajasActivas] = await Promise.all([
        dashboardRepository.getTotalsHoy(negocioId),
        dashboardRepository.getSaldosCuentas(negocioId),
        dashboardRepository.getStockCritico(negocioId),
        dashboardRepository.getResumenCreditos(negocioId),
        dashboardRepository.getMetodosPagoDistribucion(negocioId),
        dashboardRepository.getVentasPorHora(negocioId),
        dashboardRepository.getTopProductos(negocioId),
        dashboardRepository.getTopCobros(negocioId),
        dashboardRepository.getTopDeudas(negocioId),
        dashboardRepository.getCajasActivas(negocioId)
    ]);
    const ticketPromedio = totals.count > 0 ? totals.totalUSD / totals.count : 0;
    return {
        kpis: {
            ventasHoyUSD: totals.totalUSD,
            ventasHoyVES: totals.totalVES,
            ticketPromedio,
            transacciones: totals.count,
        },
        saldosCuentas: saldos,
        alertas: {
            stockCritico,
            porCobrar: creditos.porCobrar,
            porPagar: creditos.porPagar,
        },
        graficos: {
            metodosPago,
            ventasPorHora,
            topProductos,
            topCobros,
            topDeudas,
            cajasActivas,
        }
    };
}
export const dashboardService = {
    async getDashboardStats(negocioId) {
        const cached = dashboardCache.get(negocioId);
        if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
            return cached.data;
        }
        const data = await buildDashboardStats(negocioId);
        dashboardCache.set(negocioId, { data, cachedAt: Date.now() });
        return data;
    },
    /** Llama esto cuando una venta se complete para que el dashboard refleje el cambio antes del TTL */
    invalidateDashboardCache(negocioId) {
        dashboardCache.delete(negocioId);
    }
};
//# sourceMappingURL=dashboard.service.js.map