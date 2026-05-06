import type { Request, Response, NextFunction } from "express";
import { cobrosService, deudasService } from "./creditos.service.js";

// ─── Controller Cobros ────────────────────────────────────────────────────────

export const cobrosController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 50;
      const estado = req.query.estado as string | undefined;
      const result = await cobrosService.getAll(negocioId, { page, limit, ...(estado !== undefined && { estado }) });
      res.json(result);
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await cobrosService.getById(negocioId, req.params.id as string);
      res.json(result);
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await cobrosService.create(negocioId, req.body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await cobrosService.update(negocioId, req.params.id as string, req.body);
      res.json(result);
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      await cobrosService.delete(negocioId, req.params.id as string);
      res.status(204).send();
    } catch (e) { next(e); }
  },

  /** POST /cobros/:id/abono — Registra un pago (parcial o total) de un cobro */
  async registrarAbono(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await cobrosService.registrarAbono(negocioId, req.params.id as string, req.body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
};

// ─── Controller Deudas ────────────────────────────────────────────────────────

export const deudasController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const page   = parseInt(req.query.page   as string) || 1;
      const limit  = parseInt(req.query.limit  as string) || 50;
      const estado = req.query.estado as string | undefined;
      const result = await deudasService.getAll(negocioId, { page, limit, ...(estado !== undefined && { estado }) });
      res.json(result);
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await deudasService.getById(negocioId, req.params.id as string);
      res.json(result);
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await deudasService.create(negocioId, req.body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await deudasService.update(negocioId, req.params.id as string, req.body);
      res.json(result);
    } catch (e) { next(e); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      await deudasService.delete(negocioId, req.params.id as string);
      res.status(204).send();
    } catch (e) { next(e); }
  },

  /** POST /deudas/:id/abono — Registra un pago (parcial o total) de una deuda */
  async registrarAbono(req: Request, res: Response, next: NextFunction) {
    try {
      const { negocioId } = (req as any).auth;
      const result = await deudasService.registrarAbono(negocioId, req.params.id as string, req.body);
      res.status(201).json(result);
    } catch (e) { next(e); }
  },
};
