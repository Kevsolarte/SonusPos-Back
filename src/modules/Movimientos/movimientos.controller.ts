import type { Request, Response } from "express";
import { movimientosService } from "./movimientos.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

/**
 * Movimientos Controller (Kardex)
 * Responsabilidad: Exponer el historial de movimientos de inventario (entradas/salidas).
 * Los movimientos se generan automáticamente al vender, reponer o anular.
 * También permite registrar movimientos manuales para ajustes.
 */
export const movimientosController = {
  /**
   * GET /movimientos
   * Devuelve el Kardex del negocio con filtros de producto, tipo y fecha.
   */
  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const result = await movimientosService.getMovimientos(negocioId, req.query as any);
    res.status(200).json(result);
  }),

  /**
   * POST /movimientos/manual
   * Registra un ajuste manual de inventario (merma, corrección de conteo, etc.).
   * No pasa por el flujo de ventas ni de compras.
   */
  createManual: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const result = await movimientosService.createMovimientoManual(negocioId, req.body);
    res.status(201).json({ message: "Movimiento registrado correctamente", data: result });
  }),
};
