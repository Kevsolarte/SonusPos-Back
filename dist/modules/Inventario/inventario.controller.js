import { inventarioService } from "./inventario.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
/**
 * Inventario Controller
 * Responsabilidad: Recibir la request HTTP, extraer parámetros y delegar al service.
 * La validación de schemas Zod se delega al middleware `validateBody` en las rutas.
 * No contiene lógica de negocio ni acceso directo a la base de datos.
 */
export const inventarioController = {
    /**
     * GET /inventario
     * Devuelve el inventario paginado con soporte de búsqueda y filtro por categoría.
     */
    getInventario: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { page, limit, search, statusFilter } = req.query;
        const result = await inventarioService.getInventario(negocioId, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined, search, statusFilter);
        res.status(200).json(result);
    }),
    /**
     * POST /inventario/producto
     * Crea un nuevo producto con su inventario y precio inicial.
     */
    createProducto: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const producto = await inventarioService.createProducto(negocioId, req.body);
        res.status(201).json(producto);
    }),
    /**
     * PUT /inventario/producto/:id
     * Actualiza los datos de un producto existente.
     */
    updateProducto: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const producto = await inventarioService.updateProducto(negocioId, id, req.body);
        res.status(200).json(producto);
    }),
    /**
     * DELETE /inventario/producto/:id
     * Desactiva un producto (soft delete, no elimina de la BD).
     */
    deleteProducto: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        await inventarioService.deleteProducto(negocioId, id);
        res.status(200).json({ message: "Producto eliminado correctamente" });
    }),
    /**
     * POST /inventario/entrada
     * Registra una entrada de stock (reposición o compra a proveedor).
     * Soporta `proveedorId` y `estadoPago` opcionales para trazabilidad financiera.
     */
    addStock: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { productoId, cantidad, motivo, cuentaId, monto, moneda, proveedorId, estadoPago } = req.body;
        // Salvaguarda: limpiar strings "null", "undefined" o vacíos
        const isInvalidId = (id) => !id || id === "null" || id === "undefined" || id === "";
        const cleanProveedorId = isInvalidId(proveedorId) ? undefined : proveedorId;
        const cleanCuentaId = isInvalidId(cuentaId) ? undefined : cuentaId;
        console.log("🛒 [AddStock] Payload limpio -> proveedorId:", cleanProveedorId, "cuentaId:", cleanCuentaId);
        const result = await inventarioService.addStock(negocioId, productoId, cantidad, motivo, cleanCuentaId, monto, moneda, cleanProveedorId, estadoPago);
        res.status(200).json(result);
    }),
    /**
     * GET /inventario/producto/:id/historial
     * Obtiene movimientos de stock y ventas recientes para auditoría detallada.
     */
    getProductoHistory: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const history = await inventarioService.getProductoHistory(negocioId, id);
        res.status(200).json(history);
    }),
    /**
     * GET /inventario/producto/:id/ventas
     * Obtiene ventas paginadas para un producto específico.
     */
    getProductoSales: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const { page, limit } = req.query;
        const result = await inventarioService.getProductoSales(negocioId, id, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
        res.status(200).json(result);
    }),
    /**
     * GET /inventario/producto/:id/movimientos
     * Obtiene movimientos paginados para un producto específico.
     */
    getProductoMovimientos: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { id } = req.params;
        const { page, limit } = req.query;
        const result = await inventarioService.getProductoMovimientos(negocioId, id, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
        res.status(200).json(result);
    }),
};
//# sourceMappingURL=inventario.controller.js.map