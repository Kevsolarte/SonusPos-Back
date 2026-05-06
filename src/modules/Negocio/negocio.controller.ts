import type { Request, Response } from "express";
import { negocioRepository } from "./negocio.repository.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
import { getDolarTasa } from "../../helpers/tasaApi.js";

export const getNegocio = asyncHandler(async (req: Request, res: Response) => {
  const { negocioId } = (req as any).auth;
  const negocio = await negocioRepository.findByNegocioId(negocioId);
  res.json(negocio);
});

export const updateNegocio = asyncHandler(async (req: Request, res: Response) => {
  const { negocioId } = (req as any).auth;
  const updated = await negocioRepository.updateNegocio(negocioId, req.body);
  res.json(updated);
});

export const getMiSuscripcion = asyncHandler(async (req: Request, res: Response) => {
  const { negocioId } = (req as any).auth;
  const [data, tasa] = await Promise.all([
    negocioRepository.getSubscriptionData(negocioId),
    getDolarTasa()
  ]);
  res.json({ ...data, tasaDolar: tasa });
});

export const registrarPago = asyncHandler(async (req: Request, res: Response) => {
  const { negocioId } = (req as any).auth;
  const { monto, metodoPago, referencia, plan, ciclo } = req.body;

  if (!monto || !metodoPago || !referencia || !plan || !ciclo) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const pago = await negocioRepository.createSuscripcionPago(negocioId, req.body);
  res.json({ message: "Pago registrado correctamente. Pendiente de aprobación.", pago });
});
