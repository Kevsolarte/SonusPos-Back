import type { Request, Response } from "express";
import { superAdminRepository } from "./superadmin.repository.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";

export const getGlobalStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await superAdminRepository.getGlobalStats();
  res.json(stats);
});

export const getNegocios = asyncHandler(async (req: Request, res: Response) => {
  const negocios = await superAdminRepository.getAllNegocios();
  res.json(negocios);
});

export const getPendingPayments = asyncHandler(async (req: Request, res: Response) => {
  const pagos = await superAdminRepository.getPendingPayments();
  res.json(pagos);
});

import { invalidateBusinessCache } from "../../middlewares/auth.middleware.js";

export const approvePayment = asyncHandler(async (req: Request, res: Response) => {
  const { pagoId } = req.params;
  const { dias } = req.body; 
  const updated = await superAdminRepository.approvePayment(pagoId as string, dias || 30);
  
  // IMPORTANTE: Limpiar caché para que el negocio vea el cambio al instante
  invalidateBusinessCache(updated.id);
  
  res.json({ message: "Pago aprobado y suscripción extendida", updated });
});

export const rejectPayment = asyncHandler(async (req: Request, res: Response) => {
  const { pagoId } = req.params;
  const updated = await superAdminRepository.rejectPayment(pagoId as string);
  
  invalidateBusinessCache(updated.negocioId);
  
  res.json({ message: "Pago rechazado", updated });
});

export const updateNegocio = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await superAdminRepository.updateNegocioPlan(id as string, req.body);
  
  invalidateBusinessCache(id as string);
  
  res.json({ message: "Negocio actualizado con éxito", updated });
});

export const getNegocioPayments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pagos = await superAdminRepository.getPaymentsByNegocio(id as string);
  res.json(pagos);
});

export const getNegocioErrors = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const errores = await superAdminRepository.getErrorsByNegocio(id as string);
  res.json(errores);
});

export const getMethods = asyncHandler(async (req: Request, res: Response) => {
  const methods = await superAdminRepository.getMyPaymentMethods();
  res.json(methods);
});

export const createMethod = asyncHandler(async (req: Request, res: Response) => {
  const method = await superAdminRepository.createPaymentMethod(req.body);
  res.json(method);
});

export const updateMethod = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const method = await superAdminRepository.updatePaymentMethod(id as string, req.body);
  res.json(method);
});

export const deleteMethod = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await superAdminRepository.deletePaymentMethod(id as string);
  res.json({ message: "Método eliminado" });
});
