import type { Request, Response } from "express";
import { inventarioService, } from "./inventario.service.js";
import { createProductoSchema, updateProductoSchema, addStockSchema } from "./inventario.schema.js";

export const inventarioController = {

    async addStock(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const { error } = addStockSchema.safeParse(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const { productoId, cantidad, motivo } = req.body;
        const result = await inventarioService.addStock(negocioId, productoId, cantidad, motivo);
        return res.status(200).json(result);
    },
    async createProducto(req: Request, res: Response) {
        const negocioId = (req as any).auth.negocioId;
        const { error } = createProductoSchema.safeParse(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const producto = await inventarioService.createProducto(negocioId, req.body);
        return res.status(201).json(producto);
    },

    async updateProducto(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const { id } = req.params;
        const { error } = updateProductoSchema.safeParse(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const producto = await inventarioService.updateProducto(negocioId, id as string, req.body);
        return res.status(200).json(producto);
    },
    async getInventario(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const { page, limit, search } = req.query;

        const inventario = await inventarioService.getInventario(
            negocioId,
            page ? parseInt(page as string) : undefined,
            limit ? parseInt(limit as string) : undefined,
            search as string
        );
        return res.status(200).json(inventario);
    },

    async deleteProducto(req: Request, res: Response) {
        const { negocioId } = (req as any).auth;
        const { id } = req.params;
        await inventarioService.deleteProducto(negocioId, id as string);
        return res.status(200).json({ message: "Producto eliminado correctamente" });
    }
};
