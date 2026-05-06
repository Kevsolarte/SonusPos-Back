import { categoriasService } from "./categorias.service.js";
import { createCategoriaSchema, updateCategoriaSchema } from "./categorias.schema.js";
export const categoriasController = {
    async getAll(req, res) {
        try {
            const { negocioId } = req.auth;
            const categorias = await categoriasService.getCategorias(negocioId);
            res.json(categorias);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    async create(req, res) {
        try {
            const { negocioId } = req.auth;
            const data = createCategoriaSchema.parse(req.body);
            const categoria = await categoriasService.createCategoria(negocioId, data);
            res.status(201).json(categoria);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    async update(req, res) {
        try {
            const { negocioId } = req.auth;
            const data = updateCategoriaSchema.parse(req.body);
            const categoria = await categoriasService.updateCategoria(req.params.id, negocioId, data);
            res.json(categoria);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    async delete(req, res) {
        try {
            const { negocioId } = req.auth;
            await categoriasService.deleteCategoria(req.params.id, negocioId);
            res.json({ message: "Categoría eliminada con éxito" });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
//# sourceMappingURL=categorias.controller.js.map