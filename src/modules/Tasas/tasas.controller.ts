import type { Request, Response } from "express";
import { tasaService } from "./tasas.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

export const tasaController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const tasas = await tasaService.getAll(negocioId);
    res.status(200).json(tasas);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const nuevaTasa = await tasaService.create(negocioId, req.body);
    res.status(201).json(nuevaTasa);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;
    const tasaActualizada = await tasaService.update(negocioId, id as string, req.body);
    res.status(200).json(tasaActualizada);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = req.auth;
    const { id } = req.params;
    await tasaService.delete(negocioId, id as string);
    res.status(204).send();
  }),
};
