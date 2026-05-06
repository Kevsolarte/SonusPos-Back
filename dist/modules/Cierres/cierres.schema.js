import { z } from "zod";
export const abrirCierreSchema = z.object({
    montoApertura: z.number().min(0, "El monto de apertura no puede ser negativo"),
});
export const cerrarCierreSchema = z.object({
    montoCierreReal: z.number().min(0, "El monto de cierre no puede ser negativo"),
    notas: z.string().optional(),
});
export const verificarCierreSchema = z.object({
    estado: z.enum(["APROBADO", "RECHAZADO"]),
    notasAuditoria: z.string().optional(),
});
// Deprecated (for backward compatibility if needed during migration)
export const createCierreSchema = z.object({
    pagoContado: z.record(z.string(), z.number()).optional(),
});
//# sourceMappingURL=cierres.schema.js.map