import { negocioRepository } from "./negocio.repository.js";
import { asyncHandler } from "../../middlewares/asynchandler.js";
import { getDolarTasa } from "../../helpers/tasaApi.js";
import { z } from "zod";
// Schema para actualización del negocio — solo campos permitidos para el ADMIN
const updateNegocioSchema = z.object({
    nombre: z.string().min(2).max(100).optional(),
    ruc: z.string().max(30).optional().nullable(),
    direccion: z.string().max(200).optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    config: z.object({
        monedaSimbolo: z.string().max(10).optional(),
        permitirStockNegativo: z.boolean().optional(),
        ticketMensaje: z.string().max(500).optional().nullable(),
    }).optional(),
});
// Schema para registrar pago SaaS — validación de tipos y rangos correctos
const registrarPagoSchema = z.object({
    monto: z.number().positive("El monto debe ser mayor a 0"),
    metodoPago: z.string().min(1, "El método de pago es requerido"),
    referencia: z.string().min(1, "La referencia es requerida"),
    plan: z.enum(["PRUEBA", "TIENDITA", "EMPRESA"]),
    ciclo: z.enum(["MENSUAL", "TRIMESTRAL", "ANUAL"]),
    comprobanteUrl: z.string().url().optional().nullable(),
    fechaPago: z.string().optional(),
});
export const getNegocio = asyncHandler(async (req, res) => {
    const { negocioId } = req.auth;
    const negocio = await negocioRepository.findByNegocioId(negocioId);
    res.json(negocio);
});
export const updateNegocio = asyncHandler(async (req, res) => {
    const { negocioId } = req.auth;
    const result = updateNegocioSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Datos inválidos", issues: result.error.issues });
    }
    const updated = await negocioRepository.updateNegocio(negocioId, result.data);
    res.json(updated);
});
export const getMiSuscripcion = asyncHandler(async (req, res) => {
    const { negocioId } = req.auth;
    const [data, tasa] = await Promise.all([
        negocioRepository.getSubscriptionData(negocioId),
        getDolarTasa()
    ]);
    res.json({ ...data, tasaDolar: tasa });
});
export const registrarPago = asyncHandler(async (req, res) => {
    const { negocioId } = req.auth;
    const result = registrarPagoSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Datos inválidos", issues: result.error.issues });
    }
    const pago = await negocioRepository.createSuscripcionPago(negocioId, result.data);
    res.json({ message: "Pago registrado correctamente. Pendiente de aprobación.", pago });
});
//# sourceMappingURL=negocio.controller.js.map