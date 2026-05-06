import type { Request, Response } from "express";
import { usuariosService } from "./usuarios.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

export const usuariosController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = (req as any).auth;
    const usuarios = await usuariosService.getUsuarios(negocioId);
    res.json(usuarios);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { negocioId } = (req as any).auth;
    const usuario = await usuariosService.createUsuario(negocioId, req.body);
    res.status(201).json(usuario);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { negocioId } = (req as any).auth;
    const actualizado = await usuariosService.updateUsuario(id as string, negocioId, req.body);
    res.json(actualizado);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { negocioId } = (req as any).auth;
    await usuariosService.deleteUsuario(id as string, negocioId);
    res.json({ message: "Usuario eliminado" });
  }),
};
