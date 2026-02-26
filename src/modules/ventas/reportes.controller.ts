import type { Request, Response } from "express";
import { ventasService } from "./ventas.service.js";

export const reportesController = {
    async getHistory(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const { startDate, endDate, metodoPago, estado, search, page, limit } = req.query;

        const history = await ventasService.getVentasHistory(negocioId, {
            startDate: startDate as string,
            endDate: endDate as string,
            metodoPago: metodoPago as string,
            estado: estado as string,
            search: search as string,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 50
        });

        res.json(history);
    },

    async getStats(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const { fecha } = req.query;

        const stats = await ventasService.getVentasStats(negocioId, fecha as string);
        res.json(stats);
    },

    async voidSale(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const { id } = req.params;

        if (!id) throw new Error("ID de venta requerido");

        const result = await ventasService.voidSale(negocioId, id as string);
        res.json({
            message: "Venta anulada con éxito",
            venta: result
        });
    }
};
