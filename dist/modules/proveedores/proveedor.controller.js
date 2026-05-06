import { ProveedorService } from "./proveedor.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
/**
 * Proveedor Controller
 * Responsabilidad: Exponer los endpoints del directorio de proveedores.
 * Gestiona el alta, edición, baja y consulta de historial de suministros.
 */
export const ProveedorController = {
    /**
     * GET /proveedores
     * Lista todos los proveedores activos del negocio.
     */
    getAll: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search;
        const result = await ProveedorService.getAll(negocioId, page, limit, search);
        res.status(200).json(result);
    }),
    /**
     * GET /proveedores/:id
     * Devuelve el detalle de un proveedor y su historial completo de suministros.
     */
    getById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { negocioId } = req.auth;
        const proveedor = await ProveedorService.getById(id, negocioId);
        res.status(200).json(proveedor);
    }),
    /**
     * POST /proveedores
     * Registra un nuevo proveedor en el directorio del negocio.
     */
    create: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const nuevo = await ProveedorService.create(req.body, negocioId);
        res.status(201).json(nuevo);
    }),
    /**
     * PATCH /proveedores/:id
     * Actualiza los datos de contacto de un proveedor existente.
     */
    update: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { negocioId } = req.auth;
        const actualizado = await ProveedorService.update(id, negocioId, req.body);
        res.status(200).json(actualizado);
    }),
    /**
     * DELETE /proveedores/:id
     * Desactiva un proveedor (soft delete, preserva historial de suministros).
     */
    delete: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { negocioId } = req.auth;
        await ProveedorService.delete(id, negocioId);
        res.status(200).json({ message: "Proveedor eliminado" });
    }),
};
//# sourceMappingURL=proveedor.controller.js.map