import { clienteService } from "./cliente.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
import { AppError } from "../../middlewares/error.middleware.js";
/**
 * Cliente Controller
 * Responsabilidad: Gestión del directorio de clientes del negocio.
 * Los clientes se asocian a las ventas para historial y cuentas por cobrar.
 */
export const clienteController = {
    /**
     * POST /clientes
     * Registra un nuevo cliente en el negocio.
     */
    create: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const cliente = await clienteService.crearCliente(negocioId, req.body);
        res.status(201).json(cliente);
    }),
    /**
     * PATCH /clientes/:id
     * Actualiza los datos de contacto de un cliente.
     */
    update: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        if (!id)
            throw new AppError("ID requerido", 400);
        const cliente = await clienteService.actualizarCliente(id, negocioId, req.body);
        res.status(200).json(cliente);
    }),
    /**
     * DELETE /clientes/:id
     * Elimina un cliente (soft delete).
     */
    delete: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        if (!id)
            throw new AppError("ID requerido", 400);
        await clienteService.eliminarCliente(id, negocioId);
        res.status(200).json({ message: "Cliente eliminado correctamente" });
    }),
    /**
     * GET /clientes
     * Lista todos los clientes del negocio con paginación y búsqueda.
     */
    getAll: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search;
        const result = await clienteService.obtenerClientes(negocioId, page, limit, search);
        res.status(200).json(result);
    }),
    /**
     * GET /clientes/:id
     * Devuelve el detalle de un cliente y su historial de ventas.
     */
    getById: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        if (!id)
            throw new AppError("ID requerido", 400);
        const cliente = await clienteService.obtenerClientePorId(id, negocioId);
        res.status(200).json(cliente);
    }),
};
//# sourceMappingURL=cliente.controller.js.map