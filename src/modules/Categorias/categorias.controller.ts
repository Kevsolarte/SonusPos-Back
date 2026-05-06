import type { Request, Response } from "express";
import { categoriasService } from "./categorias.service.js";
import { createCategoriaSchema, updateCategoriaSchema } from "./categorias.schema.js";

export const categoriasController = {
  async getAll(req: Request, res: Response) {
    try {
      const { negocioId } = (req as any).auth;
      const categorias = await categoriasService.getCategorias(negocioId);
      res.json(categorias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { negocioId } = (req as any).auth;
      const data = createCategoriaSchema.parse(req.body);
      const categoria = await categoriasService.createCategoria(negocioId, data);
      res.status(201).json(categoria);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { negocioId } = (req as any).auth;
      const data = updateCategoriaSchema.parse(req.body);
      const categoria = await categoriasService.updateCategoria(req.params.id as string, negocioId, data);
      res.json(categoria);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { negocioId } = (req as any).auth;
      await categoriasService.deleteCategoria(req.params.id as string, negocioId);
      res.json({ message: "Categoría eliminada con éxito" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
};
