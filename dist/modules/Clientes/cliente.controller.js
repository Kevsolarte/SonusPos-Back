import { clienteService } from "./cliente.service.js";
import { AppError } from "../../middlewares/error.middleware.js";
export const clienteController = {
    async create(req, res) {
        const negocioId = req.auth.negocioId;
        const cliente = await clienteService.crearCliente(negocioId, req.body);
        res.status(201).json(cliente);
    },
    async update(req, res) {
        const negocioId = req.auth.negocioId;
        const id = req.params.id;
        if (!id)
            throw new AppError("ID requerido", 400);
        const cliente = await clienteService.actualizarCliente(id, negocioId, req.body);
        res.json(cliente);
    },
    async delete(req, res) {
        const negocioId = req.auth.negocioId;
        const id = req.params.id;
        if (!id)
            throw new AppError("ID requerido", 400);
        await clienteService.eliminarCliente(id, negocioId);
        res.json({ message: "Cliente eliminado correctamente" });
    },
    async getAll(req, res) {
        const negocioId = req.auth.negocioId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search;
        const result = await clienteService.obtenerClientes(negocioId, page, limit, search);
        res.json(result);
    },
    async getById(req, res) {
        const negocioId = req.auth.negocioId;
        const id = req.params.id;
        if (!id)
            throw new AppError("ID requerido", 400);
        const cliente = await clienteService.obtenerClientePorId(id, negocioId);
        res.json(cliente);
    },
};
//# sourceMappingURL=cliente.controller.js.map