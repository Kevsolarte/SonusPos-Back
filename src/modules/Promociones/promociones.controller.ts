import type { Request, Response } from "express";
import { promocionesService } from "./promociones.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
import { AppError } from "../../middlewares/error.middleware.js";

/**
 * Promociones Controller
 * Responsabilidad: CRUD de campañas de descuento.
 * Una promoción se vincula a uno o más productos. Al calcular una venta,
 * el ventasService detecta si hay una promo activa y aplica el descuento automáticamente.
 */
export const promocionesController = {
  /**
   * POST /promociones
   * Crea una campaña de descuento y la vincula a los productos seleccionados.
   */
  create: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const result = await promocionesService.create(negocioId, req.body);
    res.status(201).json(result);
  }),

  /**
   * GET /promociones
   * Lista todas las campañas del negocio (activas e inactivas).
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const result = await promocionesService.getAll(negocioId);
    res.status(200).json(result);
  }),

  /**
   * GET /promociones/:id
   * Devuelve el detalle de una campaña con sus productos vinculados.
   */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;
    const result = await promocionesService.getById(id as string, negocioId);
    if (!result) throw new AppError("Promoción no encontrada", 404);
    res.status(200).json(result);
  }),

  /**
   * PATCH /promociones/:id
   * Actualiza fechas, tipo o valor de descuento de una campaña.
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;
    const result = await promocionesService.update(id as string, negocioId, req.body);
    res.status(200).json(result);
  }),

  /**
   * DELETE /promociones/:id
   * Elimina una campaña y desvincula todos sus productos (Cascade en BD).
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;
    await promocionesService.delete(id as string, negocioId);
    res.status(204).send();
  }),
};
