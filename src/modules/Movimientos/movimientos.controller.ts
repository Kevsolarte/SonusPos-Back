import type { Request, Response } from "express";
import { movimientosService } from "./movimientos.service.js";
import { createMovimientoManualSchema, listMovimientosQuerySchema } from "./movimientos.schema.js";

export const movimientosController = {
    async getHistory(req: Request, res: Response) {
        const negocioId = (req as any).auth?.negocioId;
        if (!negocioId) return res.status(401).json({ message: "No autorizado" });

        const filters = listMovimientosQuerySchema.parse(req.query);
        const result = await movimientosService.getMovimientos(negocioId, filters);

        res.json(result);
    },

    async createManual(req: Request, res: Response) {
        const negocioId = (req as any).auth?.negocioId;
        if (!negocioId) return res.status(401).json({ message: "No autorizado" });

        const body = createMovimientoManualSchema.parse(req.body);
        const result = await movimientosService.createMovimientoManual(negocioId, body);

        res.status(201).json({
            message: "Movimiento registrado correctamente",
            data: result
        });
    }
};
