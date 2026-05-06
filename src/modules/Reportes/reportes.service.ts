import { reportesRepository } from "./reportes.repository.js";

export const reportesService = {
  async getGeneralReport(negocioId: string, range: string) {
    const { start, end } = this.calculateDates(range);

    const [timeline, metodos, rentabilidadRaw, topClientes] = await Promise.all([
      reportesRepository.getVentasTimeline(negocioId, start, end),
      reportesRepository.getMetodosPagoConsolidado(negocioId, start, end),
      reportesRepository.getRentabilidad(negocioId, start, end),
      reportesRepository.getTopClientes(negocioId, start, end)
    ]);

    // 1. Procesar Timeline (Agrupar por día para el gráfico)
    const dailyData: Record<string, number> = {};
    timeline.forEach(v => {
      if (!v.createdAt) return;
      const dateStr = v.createdAt.toISOString().split("T")[0] as string;
      dailyData[dateStr] = (dailyData[dateStr] || 0) + Number(v.total);
    });
    const ventasPorDia = Object.entries(dailyData).map(([d, v]) => ({ d, v }));

    // 2. Procesar Rentabilidad
    let totalVentas = 0;
    let totalCostos = 0;
    const porCategoria: Record<string, { ventas: number; costos: number }> = {};

    rentabilidadRaw.forEach(d => {
      const venta = Number(d.subtotal);
      const costo = Number(d.producto.precio?.preciocompra || 0) * Number(d.cantidad);
      const cat = d.producto.categoria?.nombre || "Sin Categoría";

      totalVentas += venta;
      totalCostos += costo;

      if (!porCategoria[cat]) porCategoria[cat] = { ventas: 0, costos: 0 };
      porCategoria[cat].ventas += venta;
      porCategoria[cat].costos += costo;
    });

    const utilidadBruta = totalVentas - totalCostos;
    const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;

    const rentabilidadCategorias = Object.entries(porCategoria).map(([nombre, data]) => ({
      nombre,
      ventas: data.ventas,
      utilidad: data.ventas - data.costos,
      margen: data.ventas > 0 ? ((data.ventas - data.costos) / data.ventas) * 100 : 0
    }));

    return {
      periodo: { start, end },
      resumen: {
        totalVentas,
        utilidadBruta,
        margenBruto,
        cantidadVentas: timeline.length
      },
      graficos: {
        ventasPorDia,
        metodosPago: metodos,
        rentabilidadCategorias
      },
      topClientes
    };
  },

  calculateDates(range: string) {
    const end = new Date();
    const start = new Date();
    
    if (range === "semanal") start.setDate(end.getDate() - 7);
    else if (range === "mensual") start.setMonth(end.getMonth() - 1);
    else if (range === "hoy") start.setHours(0, 0, 0, 0);
    else start.setDate(end.getDate() - 30); // Default 30 días

    return { start, end };
  }
};
