import { cierresService } from "./cierres.service.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
/**
 * Cierres Controller (Arqueo de Caja y Auditoría)
 * Responsabilidad: Gestionar el ciclo de vida del turno del usuario y su verificación.
 */
export const cierresController = {
    /**
     * GET /cierres/status
     * Devuelve si el usuario actual tiene una caja abierta y su balance actual.
     */
    getStatus: asyncHandler(async (req, res) => {
        const { sub: userId, negocioId } = req.auth;
        const status = await cierresService.getStatus(userId, negocioId);
        res.status(200).json(status);
    }),
    /**
     * POST /cierres/abrir
     * Inicia un nuevo turno de caja para el usuario actual.
     */
    abrirCaja: asyncHandler(async (req, res) => {
        const { sub: userId, negocioId } = req.auth;
        const result = await cierresService.abrirCaja(userId, negocioId, req.body);
        res.status(201).json({ message: "Caja abierta con éxito", data: result });
    }),
    /**
     * POST /cierres/cerrar
     * Finaliza el turno actual. Requiere el conteo físico (Cierre a Ciegas).
     * Pasa el estado a PENDIENTE de verificación.
     */
    cerrarCaja: asyncHandler(async (req, res) => {
        const { sub: userId, negocioId } = req.auth;
        const result = await cierresService.cerrarCaja(userId, negocioId, req.body);
        res.status(200).json({ message: "Reporte de cierre enviado a verificación", data: result });
    }),
    /**
     * PATCH /cierres/:id/verificar
     * El administrador aprueba o rechaza (disputa) un cierre realizado por un cajero.
     */
    verificarCierre: asyncHandler(async (req, res) => {
        const { sub: adminId } = req.auth;
        const { id } = req.params;
        const result = await cierresService.verificarCierre(adminId, id, req.body);
        res.status(200).json({ message: "Cierre auditado con éxito", data: result });
    }),
    /**
     * GET /cierres/historial
     * Lista de cierres (abiertos, pendientes, aprobados) con paginación.
     */
    getHistorial: asyncHandler(async (req, res) => {
        const { negocioId } = req.auth;
        const { page, limit, estado } = req.query;
        const history = await cierresService.getHistory(negocioId, parseInt(page) || 1, parseInt(limit) || 20, estado);
        res.status(200).json(history);
    }),
    /**
     * GET /cierres/:id/ventas
     * Lista las ventas asociadas a un cierre específico.
     */
    getVentasByCierre: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { page, limit } = req.query;
        const result = await cierresService.getVentasByCierre(id, parseInt(page) || 1, parseInt(limit) || 20);
        res.status(200).json(result);
    }),
};
//# sourceMappingURL=cierres.controller.js.map