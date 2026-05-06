import { superAdminRepository } from "./superadmin.repository.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
export const getGlobalStats = asyncHandler(async (req, res) => {
    const stats = await superAdminRepository.getGlobalStats();
    res.json(stats);
});
export const getNegocios = asyncHandler(async (req, res) => {
    const negocios = await superAdminRepository.getAllNegocios();
    res.json(negocios);
});
export const getPendingPayments = asyncHandler(async (req, res) => {
    const pagos = await superAdminRepository.getPendingPayments();
    res.json(pagos);
});
import { invalidateBusinessCache } from "../../middlewares/auth.middleware.js";
export const approvePayment = asyncHandler(async (req, res) => {
    const { pagoId } = req.params;
    const { dias } = req.body;
    const updated = await superAdminRepository.approvePayment(pagoId, dias || 30);
    // IMPORTANTE: Limpiar caché para que el negocio vea el cambio al instante
    invalidateBusinessCache(updated.id);
    res.json({ message: "Pago aprobado y suscripción extendida", updated });
});
export const rejectPayment = asyncHandler(async (req, res) => {
    const { pagoId } = req.params;
    const updated = await superAdminRepository.rejectPayment(pagoId);
    invalidateBusinessCache(updated.negocioId);
    res.json({ message: "Pago rechazado", updated });
});
export const updateNegocio = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await superAdminRepository.updateNegocioPlan(id, req.body);
    invalidateBusinessCache(id);
    res.json({ message: "Negocio actualizado con éxito", updated });
});
export const getNegocioPayments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pagos = await superAdminRepository.getPaymentsByNegocio(id);
    res.json(pagos);
});
export const getNegocioErrors = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const errores = await superAdminRepository.getErrorsByNegocio(id);
    res.json(errores);
});
export const getMethods = asyncHandler(async (req, res) => {
    const methods = await superAdminRepository.getMyPaymentMethods();
    res.json(methods);
});
export const createMethod = asyncHandler(async (req, res) => {
    const method = await superAdminRepository.createPaymentMethod(req.body);
    res.json(method);
});
export const updateMethod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const method = await superAdminRepository.updatePaymentMethod(id, req.body);
    res.json(method);
});
export const deleteMethod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await superAdminRepository.deletePaymentMethod(id);
    res.json({ message: "Método eliminado" });
});
//# sourceMappingURL=superadmin.controller.js.map