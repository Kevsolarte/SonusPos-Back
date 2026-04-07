import type { Request, Response } from "express";
import { cierresService } from "./cierres.service.js";

export const cierresController = {
    async getStatus(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const stats = await cierresService.getVentasPendientes(negocioId);
        return res.json(stats);
    },

    async cerrarCaja(req: Request, res: Response) {
        const { negocioId, sub: userId } = (req as any).auth;

        if (!negocioId || !userId) {
            return res.status(401).json({ error: "UNAUTHORIZED", message: "Datos de sesión incompletos" });
        }

        const result = await cierresService.createCierre(userId, negocioId, req.body);
        return res.json({
            message: "Cierre de caja realizado con éxito",
            data: result
        });
    },

    async getHistorial(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const { page, limit } = req.query;
        
        const history = await cierresService.getHistory(
            negocioId,
            page ? parseInt(page as string) : 1,
            limit ? parseInt(limit as string) : 20
        );
        return res.json(history);
    }
};
