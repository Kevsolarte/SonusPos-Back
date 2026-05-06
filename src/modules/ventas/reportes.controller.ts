import type { Request, Response } from "express";
import { ventasService } from "./ventas.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
import { AppError } from "../../middlewares/error.middleware.js";

/**
 * Reportes Controller
 * Responsabilidad: Exponer endpoints de consulta y gestión de ventas históricas.
 * No genera ni modifica datos de inventario directamente (eso lo hace ventasService).
 */
export const reportesController = {
  /**
   * GET /reportes/historial
   * Devuelve el historial de ventas con filtros de fecha, método de pago y estado.
   * Soporta paginación via query params: page, limit.
   */
  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { startDate, endDate, metodoPago, estado, search, page, limit } = req.query;

    const history = await ventasService.getVentasHistory(negocioId, {
      startDate: startDate as string,
      endDate: endDate as string,
      metodoPago: metodoPago as string,
      estado: estado as string,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.status(200).json(history);
  }),

  /**
   * GET /reportes/diario
   * Devuelve las estadísticas del día: total vendido, cantidad de ventas
   * y desglose por método de pago.
   */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { fecha } = req.query;
    const stats = await ventasService.getVentasStats(negocioId, fecha as string);
    res.status(200).json(stats);
  }),

  /**
   * POST /reportes/anular/:id
   * Anula una venta: revierte el stock, marca como ANULADA y
   * registra el egreso financiero si hubo cuenta asociada.
   */
  voidSale: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;

    if (!id) throw new AppError("ID de venta requerido", 400);

    const result = await ventasService.voidSale(negocioId, id as string);
    res.status(200).json({ message: "Venta anulada con éxito", venta: result });
  }),
};
