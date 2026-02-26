import type { Request, Response } from "express";
import { cierresService } from "./cierres.service.js";

export const cierresController = {
    async getStatus(req: Request, res: Response) {
        const negocioId = (req as any).auth?.negocioId;
        console.log("Consultando status de cierre. NegocioId:", negocioId);
        const stats = await cierresService.getVentasPendientes(negocioId);
        res.json(stats);
    },

    async cerrarCaja(req: Request, res: Response) {
        const negocioId = (req as any).auth?.negocioId;
        const userId = (req as any).auth?.sub; // En el JWT guardamos como 'sub'

        console.log("Iniciando cierre de caja. Negocio:", negocioId, "Usuario:", userId);

        if (!negocioId || !userId) {
            console.error("Faltan datos en req.auth:", (req as any).auth);
            return res.status(401).json({ error: "UNAUTHORIZED", message: "Datos de sesión incompletos" });
        }

        const result = await cierresService.ejecutarCierre(negocioId, userId);
        res.json({
            message: "Cierre de caja realizado con éxito",
            data: result
        });
    },

    async getHistorial(req: Request, res: Response) {
        const negocioId = (req as any).auth?.negocioId;
        const historial = await cierresService.getHistorialCierres(negocioId);
        res.json(historial);
    }
};
