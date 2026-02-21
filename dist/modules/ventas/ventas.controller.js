import { ventasService } from "./ventas.service.js";
import { createVentaFullSchema } from "./ventas.schema.js";
export const ventasController = {
    async createVenta(req, res) {
        const negocioId = req.auth.negocioId;
        const { error } = createVentaFullSchema.safeParse(req.body);
        if (error)
            return res.status(400).json({ error: error.message });
        const venta = await ventasService.createVenta(negocioId, req.body);
        return res.status(201).json(venta);
    },
    async calcularTotales(req, res) {
        const negocioId = req.auth.negocioId;
        const resultado = await ventasService.calcularTotales(negocioId, req.body);
        res.json(resultado);
    }
};
//# sourceMappingURL=ventas.controller.js.map