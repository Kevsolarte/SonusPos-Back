import type { Request, Response } from "express";
import { inventarioService, } from "./inventario.service.js";
import { createProductoSchema, entradaInventarioSchema } from "./inventario.schema.js";

export const inventarioController = {
    async createProducto(req: Request, res: Response) {
        const { error } = createProductoSchema.safeParse(req.body);
        if (error) return res.status(400).json({ error: error.message });
        const producto = await inventarioService.createProducto(req.body);
        return res.status(201).json(producto);
    },
};
export const entradaInventarioController = {
    async entradaInventario(req: Request, res: Response) {
        const { error } = entradaInventarioSchema.safeParse(req.body);
        if (error) return res.status(400).json({ error: error.message });
        const producto = await inventarioService.agregarMasProducto(req.body);
        return res.status(201).json(producto);
    },
};