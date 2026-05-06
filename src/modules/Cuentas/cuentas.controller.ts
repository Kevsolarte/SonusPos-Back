import type { Request, Response, NextFunction } from "express";
import { cuentasService } from "./cuentas.service.js";
import {
  createCuentaSchema,
  updateCuentaSchema,
  transaccionManualSchema,
} from "./cuentas.schema.js";

export const cuentasController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await cuentasService.getCuentas(negocioId);
      res.json(result);
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const data = createCuentaSchema.parse(req.body);
      const result = await cuentasService.createCuenta(negocioId, data);
      res.status(201).json(result);
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const { id } = req.params;
      const data = updateCuentaSchema.parse(req.body);
      const result = await cuentasService.updateCuenta(id as string, negocioId, data);
      res.json(result);
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const { id } = req.params;
      await cuentasService.deleteCuenta(id as string, negocioId);
      res.status(204).send();
    } catch (error) { next(error); }
  },

  /**
   * GET /cuentas/:id/movimientos
   * Historial completo de ingresos y egresos de una cuenta.
   * Query params: ?page=1&limit=50&tipo=INGRESO|EGRESO
   */
  async getMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const { id } = req.params;
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const tipo  = req.query.tipo as "INGRESO" | "EGRESO" | undefined;

      const result = await cuentasService.getMovimientos(id as string, negocioId, {
        page,
        limit,
        ...(tipo && ["INGRESO", "EGRESO"].includes(tipo) && { tipo: tipo as "INGRESO" | "EGRESO" }),
      });
      res.json(result);
    } catch (error) { next(error); }
  },

  /**
   * POST /cuentas/:id/movimiento
   * Registra ingreso o egreso manual con conversión automática de moneda.
   */
  async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const { id } = req.params;
      const data = transaccionManualSchema.parse(req.body);
      const result = await cuentasService.registrarMovimientoManual(
        id as string,
        negocioId,
        data
      );
      res.json(result);
    } catch (error) { next(error); }
  },
};
