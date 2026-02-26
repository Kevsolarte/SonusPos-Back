import { inventarioService, } from "./inventario.service.js";
import { createProductoSchema, updateProductoSchema, addStockSchema } from "./inventario.schema.js";
export const inventarioController = {
    // ... existing methods ...
    async addStock(req, res) {
        const { negocioId } = req.auth;
        const { error } = addStockSchema.safeParse(req.body);
        if (error)
            return res.status(400).json({ error: error.message });
        const { productoId, cantidad, motivo } = req.body;
        const result = await inventarioService.addStock(negocioId, productoId, cantidad, motivo);
        return res.status(200).json(result);
    },
    async createProducto(req, res) {
        const negocioId = req.auth.negocioId;
        const { error } = createProductoSchema.safeParse(req.body);
        if (error)
            return res.status(400).json({ error: error.message });
        const producto = await inventarioService.createProducto(negocioId, req.body);
        return res.status(201).json(producto);
    },
    async updateProducto(req, res) {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const { error } = updateProductoSchema.safeParse(req.body);
        if (error)
            return res.status(400).json({ error: error.message });
        const producto = await inventarioService.updateProducto(negocioId, id, req.body);
        return res.status(200).json(producto);
    },
    async getInventario(req, res) {
        const { negocioId } = req.auth;
        const { page, limit, search } = req.query;
        const inventario = await inventarioService.getInventario(negocioId, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined, search);
        return res.status(200).json(inventario);
    },
    async deleteProducto(req, res) {
        const { negocioId } = req.auth;
        const { id } = req.params;
        await inventarioService.deleteProducto(negocioId, id);
        return res.status(200).json({ message: "Producto eliminado correctamente" });
    }
};
//# sourceMappingURL=inventario.controller.js.map