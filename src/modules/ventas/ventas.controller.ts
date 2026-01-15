import type { Request, Response } from "express";
import { ventasService } from "./ventas.service.js";
import { createVentaFullSchema } from "./ventas.schema.js";

export const ventasController = {
  async createVenta(req: Request, res: Response) {
    const { error } = createVentaFullSchema.safeParse(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const venta = await ventasService.createVenta(req.body);
    return res.status(201).json(venta);
  },
};
