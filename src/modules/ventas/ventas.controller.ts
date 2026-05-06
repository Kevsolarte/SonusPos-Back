import type { Request, Response } from "express";
import { ventasService } from "./ventas.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

/**
 * Ventas Controller
 * Responsabilidad: Recibir requests del POS y delegar al ventasService.
 * El service es quien orquesta la lógica de totales, promociones, stock y pagos.
 */
export const ventasController = {
  /**
   * POST /pos/venta
   * Procesa una venta completa: calcula totales, descuenta stock,
   * registra pagos y genera el movimiento financiero en la cuenta.
   */
  createVenta: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId, sub: userId } = req.auth;
    const venta = await ventasService.createVenta(negocioId, userId, req.body);
    res.status(201).json(venta);
  }),

  /**
   * POST /pos/calcular
   * Preview de totales antes de confirmar la venta.
   * Aplica promociones y calcula márgenes sin guardar nada en la BD.
   */
  calcularTotales: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const resultado = await ventasService.calcularTotales(negocioId, req.body);
    res.status(200).json(resultado);
  }),
};
