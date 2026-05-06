import { dashboardRepository } from "./dashboard.repository.js";
export const dashboardService = {
    async getDashboardStats(negocioId) {
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
        // Calcular Ticket Promedio
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
};
//# sourceMappingURL=dashboard.service.js.map