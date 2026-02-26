import { ventasService } from "./ventas.service.js";
export const reportesController = {
    async getHistory(req, res) {
        const negocioId = req.auth.negocioId;
        const { startDate, endDate, metodoPago, estado, search, page, limit } = req.query;
        const history = await ventasService.getVentasHistory(negocioId, {
            startDate: startDate,
            endDate: endDate,
            metodoPago: metodoPago,
            estado: estado,
            search: search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        });
        res.json(history);
    },
    async getStats(req, res) {
        const negocioId = req.auth.negocioId;
        const { fecha } = req.query;
        const stats = await ventasService.getVentasStats(negocioId, fecha);
        res.json(stats);
    },
    async voidSale(req, res) {
        const negocioId = req.auth.negocioId;
        const { id } = req.params;
        if (!id)
            throw new Error("ID de venta requerido");
        const result = await ventasService.voidSale(negocioId, id);
        res.json({
            message: "Venta anulada con éxito",
            venta: result
        });
    }
};
//# sourceMappingURL=reportes.controller.js.map